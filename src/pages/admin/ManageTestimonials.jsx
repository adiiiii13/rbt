import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument } from '../../lib/firebaseHelpers';
import { defaultTestimonials } from '../../data/testimonials';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExportButton from '../../components/ExportButton';

const emptyForm = { name: '', role: '', text: '', rating: 5, type: 'student' };

export default function ManageTestimonials() {
  const { data: items, loading } = useRealtimeCollection('testimonials', { fallback: [] });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    const payload = { ...form, rating: Number(form.rating) };
    try {
      if (editing) {
        await updateDocument('testimonials', editing.id, payload);
        toast.success('Updated');
      } else {
        await addDocument('testimonials', payload);
        toast.success('Added');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await deleteItemSmart('testimonials', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, role: t.role, text: t.text, rating: t.rating, type: t.type }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Testimonials</h1><p className="text-sm text-slate-400">{items.length} testimonials</p></div>
        <div className="flex gap-2">
          <ExportButton data={items} filename="testimonials" columns={[
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'type', label: 'Type' },
            { key: 'rating', label: 'Rating' },
            { key: 'text', label: 'Text' },
          ]} />
          <button onClick={() => setModal(true)} className="btn-primary">+ Add</button>
        </div>
      </div>
      {loading && <TableSkeleton />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(t => (
          <div key={t.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex gap-1 mb-2">{[...Array(t.rating || 0)].map((_, j) => <span key={j} className="text-accent-gold text-sm">&#9733;</span>)}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Role</label><input className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Type</label><select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="student">Student</option><option value="parent">Parent</option></select></div>
          </div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Text</label><textarea className="input-field resize-none" rows={4} value={form.text} onChange={e => setForm({...form, text: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Rating (1-5)</label><input type="number" min="1" max="5" className="input-field" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} /></div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Testimonial</button>
        </div>
      </Modal>
    </div>
  );
}
