import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { useRealtimeCollection } from '../../lib/contentApi';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import InvoiceView from '../../components/InvoiceView';
import { formatCurrency } from '../../lib/invoice';
import ExportButton from '../../components/ExportButton';
import { sendStudentStatusEmail } from '../../lib/emailUtils';

const emptyForm = { studentId: '', name: '', email: '', phone: '', course: '', class: 'Class 10', password: '' };

export default function ManageStudents() {
  const navigate = useNavigate();
  const { data: students, loading } = useRealtimeCollection('students', { orderField: 'createdAt' });
  const { data: courses } = useRealtimeCollection('courses', { orderField: 'createdAt' });
  const { data: batches } = useRealtimeCollection('batches', { orderField: 'createdAt' });
  const { data: allEnrollments } = useRealtimeCollection('enrollments', { orderField: 'enrolledAt' });
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [coursesModal, setCoursesModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [fetchingEnrollments, setFetchingEnrollments] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [selected, setSelected] = useState([]);
  const [filterBatch, setFilterBatch] = useState('all');

  const filteredStudents = students.filter(s => {
    if (filterBatch === 'all') return true;
    if (filterBatch === 'none') return !s.assignedBatchId;
    return s.assignedBatchId === filterBatch;
  });

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(students.map(s => s.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Are you sure you want to delete ${selected.length} students permanently? This deletes their accounts and data.`)) return;
    
    setBusy(true);
    const fn = httpsCallable(functions, 'bulkDeleteStudents');
    
    try {
      const result = await fn({ uids: selected });
      const { success, failed } = result.data || {};
      
      if (success > 0) toast.success(`Successfully deleted ${success} students`);
      if (failed > 0) toast.error(`Failed to delete ${failed} students`);
      
      setSelected([]);
    } catch (err) {
      toast.error('An error occurred during bulk deletion');
      console.error(err);
    }
    
    setBusy(false);
  };

  const openCourses = async (s) => {
    setSelectedStudent(s);
    setCoursesModal(true);
    setFetchingEnrollments(true);
    try {
      const q = query(collection(db, 'enrollments'), where('uid', '==', s.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEnrollments(data);

      const payQ1 = getDocs(query(collection(db, 'payments'), where('studentId', '==', s.id)));
      const payQ2 = getDocs(query(collection(db, 'payments'), where('studentId', '==', s.studentId)));
      const invQ = getDocs(query(collection(db, 'invoices'), where('studentUid', '==', s.id)));

      const [p1, p2, inv] = await Promise.all([payQ1, payQ2, invQ]);
      const combined = [];
      const seen = new Set();
      
      [...p1.docs, ...p2.docs].forEach(d => {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          combined.push({ id: d.id, _type: 'payment', ...d.data() });
        }
      });
      inv.docs.forEach(d => {
        combined.push({ id: d.id, _type: 'invoice', ...d.data() });
      });
      
      // Sort by latest first based on ID or whatever, or just leave as is
      setPurchases(combined);

    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setFetchingEnrollments(false);
    }
  };

  const toggleCourseStatus = async (enrollmentId, currentStatus, courseName) => {
    const newStatus = currentStatus === 'revoked' ? 'active' : 'revoked';
    try {
      await updateDocument('enrollments', enrollmentId, { status: newStatus });
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e));
      toast.success(`Course ${newStatus === 'revoked' ? 'revoked' : 'reactivated'}`);
      
      if (selectedStudent && selectedStudent.email) {
        await sendStudentStatusEmail(selectedStudent.name, selectedStudent.email, newStatus === 'revoked' ? 'revoked' : 'granted', courseName || 'a course');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      studentId: s.studentId || '',
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      course: s.course || '',
      class: s.class || 'Class 10',
      password: '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.studentId || !form.name) { toast.error('Student ID and Name required'); return; }
    setBusy(true);
    try {
      if (editing) {
        // Edit: update Cloud Function to update Auth and Firestore
        const updateFn = httpsCallable(functions, 'updateStudent');
        const result = await updateFn({
          uid: editing.id,
          studentId: form.studentId.toUpperCase(),
          name: form.name.trim(),
          email: form.email || '',
          phone: form.phone || '',
          course: form.course || '',
          password: form.password || undefined,
        });
        if (result.data.ok || result.data.success) {
          toast.success('Student updated securely');
        }
      } else {
        // Create: use Cloud Function (creates Firebase Auth account)
        if (!form.password || form.password.length < 8) {
          toast.error('Password required (min 8 characters)');
          setBusy(false);
          return;
        }
        const createFn = httpsCallable(functions, 'createStudent');
        const result = await createFn({
          studentId: form.studentId,
          name: form.name,
          email: form.email || '',
          phone: form.phone || '',
          course: form.course || '',
          password: form.password,
        });
        if (result.data.ok || result.data.success) {
          toast.success('Student account created — can login now');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setBusy(false); }
  };

  const disable = async (s) => {
    if (!confirm(`Disable ${s.name}? They can't login after this.`)) return;
    try {
      const fn = httpsCallable(functions, 'disableStudent');
      await fn({ uid: s.id });
      if (s.email) await sendStudentStatusEmail(s.name, s.email, 'disabled', 'Account disabled by administrator');
      toast.success('Student disabled');
    } catch (err) { toast.error(err.message); }
  };

  const enable = async (s) => {
    try {
      const fn = httpsCallable(functions, 'disableStudent');
      await fn({ uid: s.id, disabled: false });
      if (s.email) await sendStudentStatusEmail(s.name, s.email, 'active');
      toast.success('Student enabled');
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.name} permanently? This deletes their account and data.`)) return;
    try {
      const fn = httpsCallable(functions, 'deleteStudent');
      await fn({ uid: s.id });
      toast.success('Student deleted');
    } catch (err) { toast.error(err.message); }
  };

  const getStudentCourses = (s) => {
    // Get active enrollments for this student
    const activeEnrollments = allEnrollments.filter(e => e.uid === s.id && e.status !== 'revoked');
    
    let courseNames = [];
    if (activeEnrollments.length > 0) {
      courseNames = activeEnrollments.map(e => {
        const c = courses.find(course => course.id === e.courseId);
        return c ? c.title : 'Unknown Course';
      });
    }

    // Include manually typed course if any
    if (s.course && !courseNames.includes(s.course)) {
      courseNames.unshift(s.course);
    }

    if (courseNames.length === 0) return 'No courses';
    return courseNames.join(', ');
  };

  const fixOldEnrollments = async () => {
    if (!confirm('This will find old enrollments without uid and link them to students using studentId. Proceed?')) return;
    setBusy(true);
    try {
      const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const enrollmentsSnap = await getDocs(collection(db, 'enrollments'));
      let count = 0;
      for (const enrollmentDoc of enrollmentsSnap.docs) {
        const data = enrollmentDoc.data();
        if (!data.uid && data.studentId) {
          const studentMatch = students.find(s => s.studentId === data.studentId);
          if (studentMatch) {
            await updateDoc(doc(db, 'enrollments', enrollmentDoc.id), {
              uid: studentMatch.id,
              studentEmail: studentMatch.email || null
            });
            count++;
          }
        }
      }
      toast.success(`Fixed ${count} old enrollments.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fix old enrollments');
    }
    setBusy(false);
  };

    return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Students</h1>
          <p className="text-sm text-slate-400">{students.length} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fixOldEnrollments} disabled={busy} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
            Fix Old Enrollments
          </button>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} disabled={busy} className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
              Delete Selected ({selected.length})
            </button>
          )}
          
          <select 
            value={filterBatch} 
            onChange={e => setFilterBatch(e.target.value)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors outline-none cursor-pointer"
          >
            <option value="all">All Batches</option>
            <option value="none">No Batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <ExportButton
            data={students}
            filename="students"
            columns={[
              { key: 'studentId', label: 'Student ID' },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'class', label: 'Class' },
              { key: 'course', label: 'Course' },
              { key: 'batch', label: 'Batch' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created At' },
            ]}
          />
          <button onClick={() => setModal(true)} className="btn-primary shadow-lg">+ Add Student</button>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="py-8"><TableSkeleton /></div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No students yet. Click + Add Student to begin.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-slate-800">
                <tr>
                  <th className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-700 bg-white/5 text-green-brand focus:ring-green-brand"
                      checked={filteredStudents.length > 0 && selected.length === filteredStudents.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-white font-bold">Student ID</th>
                  <th className="text-white font-bold">Name</th>
                  <th className="text-white font-bold">Email</th>
                  <th className="text-white font-bold">Course</th>
                  <th className="text-white font-bold">Status</th>
                  <th className="text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map(s => (
                  <tr key={s.id} className={`hover:bg-white/5 transition-colors ${selected.includes(s.id) ? 'bg-white/5' : ''}`}>
                    <td className="text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-700 bg-white/5 text-green-brand focus:ring-green-brand cursor-pointer"
                        checked={selected.includes(s.id)}
                        onChange={() => handleSelect(s.id)}
                      />
                    </td>
                    <td className="font-mono text-[11px] text-slate-500 font-bold">{s.studentId}</td>
                    <td className="font-semibold text-white">
                      <button onClick={() => navigate(`/admin/students/${s.id}`)} className="hover:text-green-brand hover:underline cursor-pointer">{s.name}</button>
                    </td>
                    <td className="text-slate-700 text-sm">{s.email || '-'}</td>
                    <td className="text-slate-700 font-medium">{getStudentCourses(s)}</td>
                    <td>
                      <span className={`badge ${s.status === 'disabled' ? 'badge-red' : 'badge-green'}`}>
                        {s.status === 'disabled' ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button onClick={() => openCourses(s)} className="text-sm font-bold text-purple-400 hover:text-purple-300 cursor-pointer">Courses</button>
                        <button onClick={() => openEdit(s)} className="text-sm font-bold text-blue-400 hover:text-blue-300 cursor-pointer">Edit</button>
                        {s.status === 'disabled' ? (
                          <button onClick={() => enable(s)} className="text-sm font-bold text-green-brand cursor-pointer">Enable</button>
                        ) : (
                          <button onClick={() => disable(s)} className="text-sm font-bold text-amber-400 cursor-pointer">Disable</button>
                        )}
                        <button onClick={() => remove(s)} className="text-sm font-bold text-red-400 cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Student' : 'Add Student'}>
        <div className="space-y-4 p-1">
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Student ID *</label>
            <input className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. STU001" />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Full Name *</label>
            <input className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Email</label>
              <input type="email" className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" />
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Phone</label>
              <input className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Class</label>
              <select className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                {['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Course</label>
              <input className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="Physics Pro" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Password {editing ? '(Leave blank to keep current)' : '*'}</label>
            <input type="password" className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            <p className="text-xs text-slate-500 mt-1">{editing ? 'Only fill this if you want to explicitly reset their password.' : 'Student will login with this password'}</p>
          </div>
          <button onClick={save} disabled={busy} className="btn-primary w-full shadow-lg mt-2 disabled:opacity-60">
            {busy ? 'Saving...' : editing ? 'Update Student' : 'Create Student Account'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={coursesModal} onClose={() => setCoursesModal(false)} title={`Courses for ${selectedStudent?.name}`}>
        <div className="p-1">
          {fetchingEnrollments ? (
            <div className="text-slate-400 text-center py-4">Loading data...</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-bold mb-3">Enrolled Courses</h3>
                {enrollments.length === 0 ? (
                  <div className="text-slate-500 text-center py-4 bg-white/5 rounded-xl border border-slate-800">No enrolled courses.</div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map(e => {
                      const course = courses.find(c => c.id === e.courseId);
                      const isRevoked = e.status === 'revoked';
                      return (
                        <div key={e.id} className="bg-white/5 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white mb-0.5">{course?.title || 'Unknown Course'}</p>
                            <p className="text-xs text-slate-400">Purchased: {e.enrolledAt?.toDate ? new Date(e.enrolledAt.toDate()).toLocaleString() : 'Unknown'}</p>
                            {isRevoked && <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Revoked</span>}
                          </div>
                          <button 
                            onClick={() => toggleCourseStatus(e.id, e.status, course?.title)}
                            className={`text-sm font-bold cursor-pointer ${isRevoked ? 'text-green-brand hover:text-green-400' : 'text-amber-400 hover:text-amber-300'}`}
                          >
                            {isRevoked ? 'Reactivate' : 'Revoke Access'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Invoices & Payments</h3>
                {purchases.length === 0 ? (
                  <div className="text-slate-500 text-center py-4 bg-white/5 rounded-xl border border-slate-800">No purchases found.</div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map(p => (
                      <div key={p.id} className="bg-white/5 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white mb-0.5">{p.invoiceNumber || p.paymentId || 'INV-MANUAL'}</p>
                          <p className="text-xs text-slate-400">{p._type === 'invoice' ? p.courseName : (p.courseTitle || p.videoTitle)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-green-brand font-semibold text-sm">{formatCurrency(p.amount)}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{p.status}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedInvoice(p)}
                          className="text-sm font-bold text-blue-400 hover:text-blue-300 cursor-pointer text-left sm:text-right"
                        >
                          View Invoice
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Invoice Modal overlaid */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Details">
        {selectedInvoice && (
          <InvoiceView 
            invoice={
              selectedInvoice._type === 'payment' ? {
                invoiceNumber: selectedInvoice.invoiceNumber || selectedInvoice.paymentId || selectedInvoice.id,
                date: selectedInvoice.paidAt?.toDate ? new Date(selectedInvoice.paidAt.toDate()).toLocaleString() : new Date(selectedInvoice.createdAt?.toDate?.() || Date.now()).toLocaleString(),
                studentName: selectedInvoice.studentName || selectedStudent?.name,
                studentEmail: selectedInvoice.studentEmail || selectedStudent?.email,
                videoTitle: selectedInvoice.videoTitle || selectedInvoice.courseTitle,
                amount: selectedInvoice.amount,
                transactionId: selectedInvoice.gpayTransactionId || selectedInvoice.paymentId || selectedInvoice.id,
                paymentMethod: selectedInvoice.type === 'razorpay_webhook' || selectedInvoice.type === 'razorpay' ? 'Razorpay' : 'UPI / Google Pay',
                upiId: (selectedInvoice.type === 'razorpay_webhook' || selectedInvoice.type === 'razorpay') ? null : (import.meta.env.VITE_UPI_ID || 'rbtmission@upi'),
                status: selectedInvoice.status
              } : {
                invoiceNumber: selectedInvoice.invoiceNumber,
                date: selectedInvoice.dueDate || 'N/A',
                studentName: selectedInvoice.studentName || selectedStudent?.name,
                studentEmail: selectedInvoice.studentEmail || selectedStudent?.email,
                courseName: selectedInvoice.courseName,
                description: selectedInvoice.description,
                amount: selectedInvoice.amount,
                transactionId: selectedInvoice.id,
                paymentMethod: 'Manual Invoice',
                upiId: null,
                status: selectedInvoice.status
              }
            } 
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </Modal>
    </div>
  );
}
