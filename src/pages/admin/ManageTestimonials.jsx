import { useState } from 'react';
import Modal from '../../components/Modal';
import { getTestimonials, saveTestimonials } from '../../data/testimonials';

export default function ManageTestimonials() {
  const [items, setItems] = useState(getTestimonials());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', text: '', rating: 5, type: 'student' });

  const save = () => {
    if (editing) {
      const updated = items.map(t => t.id === editing.id ? { ...t, ...form, rating: Number(form.rating) } : t);
      setItems(updated); saveTestimonials(updated);
    } else {
      const updated = [...items, { ...form, id: `t_${Date.now()}`, rating: Number(form.rating) }];
      setItems(updated); saveTestimonials(updated);
    }
    closeModal();
  };

  const remove = (id) => { const updated = items.filter(t => t.id !== id); setItems(updated); saveTestimonials(updated); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, role: t.role, text: t.text, rating: t.rating, type: t.type }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm({ name: '', role: '', text: '', rating: 5, type: 'student' }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Testimonials</h1><p className="text-sm text-slate-400">{items.length} testimonials</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(t => (
          <div key={t.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex gap-1 mb-2">{[...Array(t.rating)].map((_, j) => <span key={j} className="text-accent-gold text-sm">★</span>)}</div>
            <p className="text-sm text-slate-300 mb-3 italic line-clamp-3">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center justify-between">
              <div><p className="font-semibold text-white text-sm">{t.name}</p><p className="text-xs text-slate-400">{t.role}</p></div>
              <div className="flex gap-2"><button onClick={() => openEdit(t)} className="text-xs text-blue-600 cursor-pointer">Edit</button><button onClick={() => remove(t.id)} className="text-xs text-red-600 cursor-pointer">Del</button></div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Testimonial' : 'Add Testimonial'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Name</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Role</label><input className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Type</label><select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="student">Student</option><option value="parent">Parent</option></select></div>
          </div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Testimonial</label><textarea rows={3} className="input-field" value={form.text} onChange={e => setForm({...form, text: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Rating</label><select className="input-field" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})}>{[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}</select></div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'}</button>
        </div>
      </Modal>
    </div>
  );
}
