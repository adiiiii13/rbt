import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateDocument, addDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/invoice';
import { sendStudentStatusEmail } from '../../lib/emailUtils';

const TABS = ['Profile', 'Batch', 'Courses', 'Mock Tests', 'PDFs', 'Payments'];

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Profile');
  const [busy, setBusy] = useState(false);

  // Profile edit state
  const [editForm, setEditForm] = useState({});

  // Enrollments + payments
  const [enrollments, setEnrollments] = useState([]);
  const [mockAccess, setMockAccess] = useState([]);
  const [pdfAccessList, setPdfAccessList] = useState([]);
  const [payments, setPayments] = useState([]);

  // Collections for grant dropdowns
  const { data: allCourses } = useRealtimeCollection('courses', 'createdAt');
  const { data: allBatches } = useRealtimeCollection('batches', 'createdAt');
  const { data: allMockTests } = useRealtimeCollection('mockTests', { fallback: [] });
  const { data: allPdfs } = useRealtimeCollection('pdfs', { fallback: [] });

  // Grant form state
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantTestId, setGrantTestId] = useState('');
  const [grantPdfId, setGrantPdfId] = useState('');
  const [grantBatch, setGrantBatch] = useState('');

  // Load student doc
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'students', studentId));
        if (!snap.exists()) {
          toast.error('Student not found');
          navigate('/admin/students');
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        setStudent(data);
        setEditForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          studentId: data.studentId || '',
          class: data.class || '',
          batch: data.batch || '',
        });
        setGrantBatch(data.batch || '');
      } catch (err) {
        toast.error('Failed to load student');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  // Load related data
  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const [enrSnap, mockSnap, pdfSnap, paySnap1, paySnap2, invSnap] = await Promise.all([
          getDocs(query(collection(db, 'enrollments'), where('uid', '==', studentId))),
          getDocs(query(collection(db, 'mockTestAccess'), where('uid', '==', studentId))),
          getDocs(query(collection(db, 'pdfAccess'), where('uid', '==', studentId))),
          getDocs(query(collection(db, 'payments'), where('studentUid', '==', studentId))),
          getDocs(query(collection(db, 'payments'), where('studentId', '==', studentId))),
          getDocs(query(collection(db, 'invoices'), where('studentUid', '==', studentId))),
        ]);

        setEnrollments(enrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setMockAccess(mockSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPdfAccessList(pdfSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const seen = new Set();
        const combined = [];
        [...paySnap1.docs, ...paySnap2.docs].forEach(d => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            combined.push({ id: d.id, _type: 'payment', ...d.data() });
          }
        });
        invSnap.docs.forEach(d => combined.push({ id: d.id, _type: 'invoice', ...d.data() }));
        combined.sort((a, b) => {
          const da = a.createdAt?.seconds || a.paidAt?.seconds || 0;
          const db2 = b.createdAt?.seconds || b.paidAt?.seconds || 0;
          return db2 - da;
        });
        setPayments(combined);
      } catch {}
    })();
  }, [studentId]);

  // ─── Profile Actions ─────────────────────────────────────

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updateDocument('students', studentId, {
        name: editForm.name,
        phone: editForm.phone,
        class: editForm.class,
        studentId: editForm.studentId,
      });
      setStudent(s => ({ ...s, ...editForm }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const disableStudent = async () => {
    if (!confirm(`Disable ${student.name}?`)) return;
    try {
      await httpsCallable(functions, 'disableStudent')({ uid: studentId });
      if (student.email) await sendStudentStatusEmail(student.name, student.email, 'disabled', 'Account');
      setStudent(s => ({ ...s, status: 'disabled' }));
      toast.success('Disabled');
    } catch (err) { toast.error(err.message); }
  };

  const enableStudent = async () => {
    try {
      await httpsCallable(functions, 'disableStudent')({ uid: studentId, disabled: false });
      if (student.email) await sendStudentStatusEmail(student.name, student.email, 'active');
      setStudent(s => ({ ...s, status: 'active' }));
      toast.success('Enabled');
    } catch (err) { toast.error(err.message); }
  };

  const deleteStudent = async () => {
    if (!confirm(`Delete ${student.name} permanently? All data removed.`)) return;
    try {
      await httpsCallable(functions, 'deleteStudent')({ uid: studentId });
      toast.success('Deleted');
      navigate('/admin/students');
    } catch (err) { toast.error(err.message); }
  };

  // ─── Batch ───────────────────────────────────────────────

  const assignBatch = async () => {
    if (!grantBatch) { toast.error('Select a batch'); return; }
    setBusy(true);
    try {
      await updateDocument('students', studentId, { batch: grantBatch });
      setStudent(s => ({ ...s, batch: grantBatch }));
      toast.success(`Batch set to ${grantBatch}`);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  // ─── Course Grant ────────────────────────────────────────

  const grantCourse = async () => {
    if (!grantCourseId) { toast.error('Select a course'); return; }
    const course = allCourses.find(c => c.id === grantCourseId);
    if (!course) return;
    setBusy(true);
    try {
      await addDocument('enrollments', {
        uid: studentId,
        courseId: grantCourseId,
        courseTitle: course.title || '',
        status: 'active',
        enrolledAt: new Date().toISOString(),
        grantedByAdmin: true,
        studentName: student.name || '',
        studentEmail: student.email || '',
      });
      setGrantCourseId('');
      // Reload enrollments
      const snap = await getDocs(query(collection(db, 'enrollments'), where('uid', '==', studentId)));
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      toast.success(`Granted: ${course.title}`);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const toggleEnrollment = async (enr) => {
    const newStatus = enr.status === 'revoked' ? 'active' : 'revoked';
    try {
      await updateDocument('enrollments', enr.id, { status: newStatus });
      setEnrollments(prev => prev.map(e => e.id === enr.id ? { ...e, status: newStatus } : e));
      toast.success(`Course ${newStatus === 'revoked' ? 'revoked' : 'reactivated'}`);
    } catch (err) { toast.error(err.message); }
  };

  // ─── Mock Test Grant ─────────────────────────────────────

  const grantTest = async () => {
    if (!grantTestId) { toast.error('Select a test'); return; }
    const test = allMockTests.find(t => t.id === grantTestId);
    if (!test) return;
    setBusy(true);
    try {
      await addDocument('mockTestAccess', {
        uid: studentId,
        testId: grantTestId,
        testTitle: test.title || '',
        status: 'active',
        enrolledAt: new Date().toISOString(),
        grantedByAdmin: true,
        studentName: student.name || '',
        studentEmail: student.email || '',
      });
      setGrantTestId('');
      const snap = await getDocs(query(collection(db, 'mockTestAccess'), where('uid', '==', studentId)));
      setMockAccess(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      toast.success(`Granted: ${test.title}`);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const revokeTestAccess = async (acc) => {
    try {
      await deleteDocument('mockTestAccess', acc.id);
      setMockAccess(prev => prev.filter(a => a.id !== acc.id));
      toast.success('Test access revoked');
    } catch (err) { toast.error(err.message); }
  };

  // ─── PDF Grant ───────────────────────────────────────────

  const grantPdf = async () => {
    if (!grantPdfId) { toast.error('Select a PDF'); return; }
    const pdf = allPdfs.find(p => p.id === grantPdfId);
    if (!pdf) return;
    setBusy(true);
    try {
      await addDocument('pdfAccess', {
        uid: studentId,
        pdfId: grantPdfId,
        pdfTitle: pdf.title || '',
        status: 'active',
        enrolledAt: new Date().toISOString(),
        grantedByAdmin: true,
        studentName: student.name || '',
        studentEmail: student.email || '',
      });
      setGrantPdfId('');
      const snap = await getDocs(query(collection(db, 'pdfAccess'), where('uid', '==', studentId)));
      setPdfAccessList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      toast.success(`Granted: ${pdf.title}`);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const revokePdfAccess = async (acc) => {
    try {
      await deleteDocument('pdfAccess', acc.id);
      setPdfAccessList(prev => prev.filter(a => a.id !== acc.id));
      toast.success('PDF access revoked');
    } catch (err) { toast.error(err.message); }
  };

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4" />
          <div className="h-64 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const statusBadge = (s) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      disabled: 'bg-red-500/20 text-red-400',
      revoked: 'bg-yellow-500/20 text-yellow-400',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[s] || 'bg-slate-500/20 text-slate-400'}`}>{s || 'unknown'}</span>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/admin/students')} className="text-slate-400 hover:text-white text-sm mb-1">&larr; Back to Students</button>
          <h1 className="text-2xl font-bold text-white">{student.name || 'Unnamed'}</h1>
          <p className="text-sm text-slate-400">{student.email} &middot; {student.studentId} {statusBadge(student.status)}</p>
        </div>
        <div className="flex gap-2">
          {student.status === 'disabled'
            ? <button onClick={enableStudent} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded">Enable</button>
            : <button onClick={disableStudent} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded">Disable</button>
          }
          <button onClick={deleteStudent} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t ? 'border-green-brand text-green-brand' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input value={editForm.email} disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Student ID</label>
            <input value={editForm.studentId} onChange={e => setEditForm({ ...editForm, studentId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Class</label>
            <input value={editForm.class} onChange={e => setEditForm({ ...editForm, class: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="md:col-span-2">
            <button onClick={saveProfile} disabled={busy}
              className="px-6 py-2 bg-green-brand hover:bg-green-600 text-white rounded text-sm disabled:opacity-50">
              {busy ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {tab === 'Batch' && (
        <div className="max-w-md space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Current Batch</p>
            <p className="text-lg font-bold text-white">{student.batch || 'None'}</p>
          </div>
          <div className="flex gap-2">
            <select value={grantBatch} onChange={e => setGrantBatch(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="" className="bg-slate-900">Select batch...</option>
              {allBatches.map(b => (
                <option key={b.id} value={b.name || b.id} className="bg-slate-900">{b.name || b.id}</option>
              ))}
            </select>
            <button onClick={assignBatch} disabled={busy}
              className="px-4 py-2 bg-green-brand hover:bg-green-600 text-white rounded text-sm disabled:opacity-50">
              Assign
            </button>
          </div>
        </div>
      )}

      {tab === 'Courses' && (
        <div className="space-y-4">
          {/* Grant new */}
          <div className="flex gap-2 flex-wrap">
            <select value={grantCourseId} onChange={e => setGrantCourseId(e.target.value)}
              className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="" className="bg-slate-900">Select course to grant...</option>
              {allCourses.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>)}
            </select>
            <button onClick={grantCourse} disabled={busy || !grantCourseId}
              className="px-4 py-2 bg-green-brand hover:bg-green-600 text-white rounded text-sm disabled:opacity-50">
              Grant Free Access
            </button>
          </div>
          {/* Existing enrollments */}
          {enrollments.length === 0
            ? <p className="text-slate-500 text-sm">No course enrollments</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-4">Course</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(e => (
                      <tr key={e.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-white">{e.courseTitle || e.courseId}</td>
                        <td className="py-2 pr-4">{statusBadge(e.status)}</td>
                        <td className="py-2 pr-4 text-slate-400">{e.grantedByAdmin ? 'Admin Grant' : 'Paid'}</td>
                        <td className="py-2">
                          <button onClick={() => toggleEnrollment(e)}
                            className={`text-xs px-3 py-1 rounded ${e.status === 'revoked' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {e.status === 'revoked' ? 'Reactivate' : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'Mock Tests' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select value={grantTestId} onChange={e => setGrantTestId(e.target.value)}
              className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="" className="bg-slate-900">Select test to grant...</option>
              {allMockTests.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.title}</option>)}
            </select>
            <button onClick={grantTest} disabled={busy || !grantTestId}
              className="px-4 py-2 bg-green-brand hover:bg-green-600 text-white rounded text-sm disabled:opacity-50">
              Grant Free Access
            </button>
          </div>
          {mockAccess.length === 0
            ? <p className="text-slate-500 text-sm">No mock test access</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-4">Test</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAccess.map(a => (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-white">{a.testTitle || a.testId}</td>
                        <td className="py-2 pr-4 text-slate-400">{a.grantedByAdmin ? 'Admin Grant' : 'Paid'}</td>
                        <td className="py-2">
                          <button onClick={() => revokeTestAccess(a)}
                            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400">
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'PDFs' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select value={grantPdfId} onChange={e => setGrantPdfId(e.target.value)}
              className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="" className="bg-slate-900">Select PDF to grant...</option>
              {allPdfs.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>)}
            </select>
            <button onClick={grantPdf} disabled={busy || !grantPdfId}
              className="px-4 py-2 bg-green-brand hover:bg-green-600 text-white rounded text-sm disabled:opacity-50">
              Grant Free Access
            </button>
          </div>
          {pdfAccessList.length === 0
            ? <p className="text-slate-500 text-sm">No PDF access</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-4">PDF</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfAccessList.map(a => (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-white">{a.pdfTitle || a.pdfId}</td>
                        <td className="py-2 pr-4 text-slate-400">{a.grantedByAdmin ? 'Admin Grant' : 'Paid'}</td>
                        <td className="py-2">
                          <button onClick={() => revokePdfAccess(a)}
                            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400">
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'Payments' && (
        <div>
          {payments.length === 0
            ? <p className="text-slate-500 text-sm">No payments or invoices</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Item</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-slate-400">{p._type === 'invoice' ? 'Invoice' : 'Payment'}</td>
                        <td className="py-2 pr-4 text-white">{p.courseTitle || p.courseName || '—'}</td>
                        <td className="py-2 pr-4 text-white">{formatCurrency(p.amount || 0)}</td>
                        <td className="py-2 pr-4">{statusBadge(p.status)}</td>
                        <td className="py-2 pr-4 text-slate-400">{p.paidAt || p.createdAt?.toDate?.()?.toLocaleDateString?.('en-IN') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}
    </div>
  );
}
