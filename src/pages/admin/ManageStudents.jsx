import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { httpsCallable } from 'firebase/functions';
import Modal from '../../components/Modal';
import { functions } from '../../lib/firebase';
import { getCollection } from '../../lib/firebaseHelpers';

const emptyForm = { studentId: '', name: '', email: '', password: '', phone: '', course: '', class: 'Class 10' };

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await getCollection('students');
      setStudents(list);
    } catch (err) {
      console.error('[students]', err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.studentId || !form.name) {
      toast.error('Student ID and Name required');
      return;
    }
    if (!editing && (!form.password || form.password.length < 8)) {
      toast.error('Password must be 8+ characters');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        toast.error('Edit via Cloud Function not yet wired');
      } else {
        const fn = httpsCallable(functions, 'createStudent');
        await fn({
          studentId: form.studentId,
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          course: form.course,
          password: form.password,
        });
        toast.success('Student created');
        await reload();
        closeModal();
      }
    } catch (err) {
      console.error('[createStudent]', err);
      toast.error(err.message || 'Failed to save student');
    } finally {
      setBusy(false);
    }
  };

  const toggleDisable = async (s) => {
    if (!confirm(`${s.status === 'disabled' ? 'Enable' : 'Disable'} ${s.name}?`)) return;
    try {
      const fn = httpsCallable(functions, 'disableStudent');
      await fn({ uid: s.id, disabled: s.status !== 'disabled' });
      toast.success('Updated');
      await reload();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.name} permanently? This removes account + data.`)) return;
    try {
      const fn = httpsCallable(functions, 'deleteStudent');
      await fn({ uid: s.id });
      toast.success('Deleted');
      await reload();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Manage Students</h1>
          <p className="text-sm text-slate-600 font-medium">{students.length} students enrolled</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary shadow-lg">+ Add Student</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No students yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-navy font-bold">Student ID</th>
                  <th className="text-navy font-bold">Name</th>
                  <th className="text-navy font-bold">Email</th>
                  <th className="text-navy font-bold">Course</th>
                  <th className="text-navy font-bold">Status</th>
                  <th className="text-navy font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-[11px] text-slate-500 font-bold">{s.studentId}</td>
                    <td className="font-semibold text-navy">{s.name}</td>
                    <td className="text-slate-700 text-sm">{s.email}</td>
                    <td className="text-slate-700 font-medium">{s.course || '-'}</td>
                    <td>
                      <span className={`badge ${s.status === 'disabled' ? 'badge-red' : 'badge-green'}`}>
                        {s.status === 'disabled' ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button onClick={() => toggleDisable(s)} className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                          {s.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                        <button onClick={() => remove(s)} className="text-sm font-bold text-red-500 hover:text-red-600 cursor-pointer">Delete</button>
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
            <label className="text-sm font-bold text-navy mb-1.5 block">Student ID *</label>
            <input className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. STU001" />
          </div>
          <div>
            <label className="text-sm font-bold text-navy mb-1.5 block">Full Name *</label>
            <input className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Email (optional)</label>
              <input type="email" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="auto-generated if blank" />
            </div>
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Phone</label>
              <input className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Class</label>
              <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                {['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Course</label>
              <input className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="Physics Pro" />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Password * (min 8 chars)</label>
              <input type="password" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <button onClick={save} disabled={busy} className="btn-primary w-full shadow-lg mt-2 disabled:opacity-60">
            {busy ? 'Saving...' : editing ? 'Update Student' : 'Create Student'}
          </button>
          <p className="text-xs text-slate-500 text-center">
            Note: requires Cloud Functions deployed (Blaze plan).
          </p>
        </div>
      </Modal>
    </div>
  );
}
