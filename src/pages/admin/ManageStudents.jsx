import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { useRealtimeCollection } from '../../lib/contentApi';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

const emptyForm = { studentId: '', name: '', email: '', phone: '', course: '', class: 'Class 10', password: '' };

export default function ManageStudents() {
  const { data: students, loading } = useRealtimeCollection('students', 'createdAt');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

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
            <div className="p-12 text-center text-slate-500">Loading...</div>
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
                    <td className="text-slate-700 font-medium">{s.course || '-'}</td>
                    <td>
                      <span className={`badge ${s.status === 'disabled' ? 'badge-red' : 'badge-green'}`}>
                        {s.status === 'disabled' ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
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
    </div>
  );
}
