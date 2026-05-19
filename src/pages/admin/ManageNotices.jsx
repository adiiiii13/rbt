import { useState } from 'react';
import { useRealtimeCollection, deleteItemSmart } from '../../lib/contentApi';
import { addDocument, updateDocument } from '../../lib/firebaseHelpers';
import { defaultNotices } from '../../data/notices';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { CalendarIcon } from '../../components/Icons';

const emptyForm = { title: '', content: '', priority: 'medium', category: 'General' };

export default function ManageNotices() {
  const { data: notices, loading } = useRealtimeCollection('notices', 'createdAt', defaultNotices);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    const payload = { ...form };
    try {
      if (editing) {
        await updateDocument('notices', editing.id, payload);
        toast.success('Notice updated');
      } else {
        await addDocument('notices', { ...payload, date: new Date().toISOString().split('T')[0] });
        toast.success('Notice published');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try { await deleteItemSmart('notices', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const openEdit = (n) => { setEditing(n); setForm({ title: n.title, content: n.content, priority: n.priority, category: n.category }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Notices</h1><p className="text-sm text-slate-400">{notices.length} notices</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Notice</button>
      </div>
      {loading && <div className="text-slate-400 text-sm mb-4">Loading...</div>}
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
              <span className="inline-flex items-center gap-1"><CalendarIcon size={12} /> {n.date || ''}</span>
              <span className="badge badge-navy">{n.category}</span>
              <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-gold' : 'badge-green'}`}>{n.priority}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Notice' : 'Add Notice'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Content</label><textarea className="input-field resize-none" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Priority</label><select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Category</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{['General','Academic','Exam','Holiday','Event','Fee'].map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Publish'} Notice</button>
        </div>
      </Modal>
    </div>
  );
}
