import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
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

const emptyForm = { studentId: '', name: '', email: '', phone: '', course: '', class: 'Class 10', password: '' };

export default function ManageStudents() {
  const { data: students, loading } = useRealtimeCollection('students', 'createdAt');
  const { data: courses } = useRealtimeCollection('courses', 'createdAt');
  const { data: allEnrollments } = useRealtimeCollection('enrollments', 'createdAt');
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

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

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

  const toggleCourseStatus = async (enrollmentId, currentStatus) => {
    const newStatus = currentStatus === 'revoked' ? 'active' : 'revoked';
    try {
      await updateDocument('enrollments', enrollmentId, { status: newStatus });
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e));
      toast.success(`Course ${newStatus === 'revoked' ? 'revoked' : 'reactivated'}`);
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
        // Edit: update Firestore doc directly
        await updateDocument('students', editing.id, {
          studentId: form.studentId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          course: form.course,
          class: form.class,
        });
        toast.success('Student updated');
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
        if (result.data.success) {
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
      toast.success('Student disabled');
    } catch (err) { toast.error(err.message); }
  };

  const enable = async (s) => {
    try {
      await updateDocument('students', s.id, { status: 'active' });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Students</h1>
          <p className="text-sm text-slate-400">{students.length} students enrolled</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary shadow-lg">+ Add Student</button>
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
                  <th className="text-white font-bold">Student ID</th>
                  <th className="text-white font-bold">Name</th>
                  <th className="text-white font-bold">Email</th>
                  <th className="text-white font-bold">Course</th>
                  <th className="text-white font-bold">Status</th>
                  <th className="text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-mono text-[11px] text-slate-500 font-bold">{s.studentId}</td>
                    <td className="font-semibold text-white">{s.name}</td>
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
          {!editing && (
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Password *</label>
              <input type="password" className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
              <p className="text-xs text-slate-500 mt-1">Student will login with this password</p>
            </div>
          )}
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
                            onClick={() => toggleCourseStatus(e.id, e.status)}
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
