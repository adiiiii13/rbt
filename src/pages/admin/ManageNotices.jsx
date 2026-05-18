import { useState } from 'react';
import Modal from '../../components/Modal';
import { getNotices, saveNotices } from '../../data/notices';
import { CalendarIcon } from '../../components/Icons';

export default function ManageNotices() {
  const [notices, setNotices] = useState(getNotices());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium', category: 'General' });

  const save = () => {
    if (editing) {
      const updated = notices.map(n => n.id === editing.id ? { ...n, ...form } : n);
      setNotices(updated); saveNotices(updated);
    } else {
      const updated = [{ ...form, id: `n_${Date.now()}`, date: new Date().toISOString().split('T')[0] }, ...notices];
      setNotices(updated); saveNotices(updated);
    }
    closeModal();
  };

  const remove = (id) => { const updated = notices.filter(n => n.id !== id); setNotices(updated); saveNotices(updated); };
  const openEdit = (n) => { setEditing(n); setForm({ title: n.title, content: n.content, priority: n.priority, category: n.category }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm({ title: '', content: '', priority: 'medium', category: 'General' }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Notices</h1><p className="text-sm text-slate-400">{notices.length} notices</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Notice</button>
      </div>
      <div className="space-y-4">
        {notices.map(n => (
          <div key={n.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <h3 className="font-bold text-white">{n.title}</h3>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(n)} className="text-sm text-blue-600 cursor-pointer">Edit</button>
                <button onClick={() => remove(n.id)} className="text-sm text-red-600 cursor-pointer">Delete</button>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-2">{n.content}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><CalendarIcon size={12} /> {n.date}</span>
              <span className="badge badge-navy">{n.category}</span>
              <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-gold' : 'badge-green'}`}>{n.priority}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Notice' : 'Add Notice'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Content</label><textarea rows={3} className="input-field" value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Priority</label><select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Category</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>General</option><option>Admission</option><option>Exam</option><option>Classes</option><option>Holiday</option></select></div>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Notice</button>
        </div>
      </Modal>
    </div>
  );
}
