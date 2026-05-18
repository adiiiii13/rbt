import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { useRealtimeCollection } from '../../lib/contentApi';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const emptyForm = { studentId: '', name: '', email: '', phone: '', course: '', class: 'Class 10', status: 'active', role: 'student' };

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
      status: s.status || 'active',
      role: s.role || 'student',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.studentId || !form.name) { toast.error('Student ID and Name required'); return; }
    setBusy(true);
    try {
      if (editing) {
        await updateDocument('students', editing.id, {
          studentId: form.studentId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          course: form.course,
          class: form.class,
          status: form.status,
        });
        toast.success('Student updated');
      } else {
        // Check if email already exists
        if (form.email) {
          const q = query(collection(db, 'students'), where('email', '==', form.email));
          const snap = await getDocs(q);
          if (!snap.empty) { toast.error('Email already exists'); setBusy(false); return; }
        }
        await addDocument('students', {
          ...form,
          email: form.email || '',
          phone: form.phone || '',
          course: form.course || '',
        });
        toast.success('Student added');
        toast('Note: To allow login, create Firebase Auth account separately', { icon: 'info' });
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setBusy(false); }
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.name} permanently?`)) return;
    try {
      await deleteDocument('students', s.id);
      toast.success('Deleted');
    } catch (err) { toast.error(err.message || 'Failed'); }
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
            <div className="p-12 text-center text-slate-500">No students yet. Click + Add Student to begin.</div>
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
                    <td className="text-slate-700 text-sm">{s.email || '-'}</td>
                    <td className="text-slate-700 font-medium">{s.course || '-'}</td>
                    <td>
                      <span className={`badge ${s.status === 'disabled' ? 'badge-red' : 'badge-green'}`}>
                        {s.status === 'disabled' ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(s)} className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer">Edit</button>
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
              <label className="text-sm font-bold text-navy mb-1.5 block">Email</label>
              <input type="email" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" />
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
          {editing && (
            <div>
              <label className="text-sm font-bold text-navy mb-1.5 block">Status</label>
              <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-navy focus:border-green-brand focus:ring-0 transition-all outline-none" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          )}
          <button onClick={save} disabled={busy} className="btn-primary w-full shadow-lg mt-2 disabled:opacity-60">
            {busy ? 'Saving...' : editing ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
