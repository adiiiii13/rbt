import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/contentApi';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const emptyForm = { title: '', message: '', whatsappMessage: '', whatsappPhone: '918888888888', active: true, bgColor: '#16a34a', startDate: '', endDate: '' };

export default function ManageOffers() {
  const { data: offers, loading } = useRealtimeCollection('offers', 'createdAt', []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    try {
      if (editing) {
        await updateDocument('offers', editing.id, form);
        toast.success('Offer updated');
      } else {
        await addDocument('offers', form);
        toast.success('Offer created');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const toggleActive = async (offer) => {
    try { await updateDocument('offers', offer.id, { active: !offer.active }); toast.success(offer.active ? 'Deactivated' : 'Activated'); }
    catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try { await deleteDocument('offers', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const openEdit = (o) => { setEditing(o); setForm({ title: o.title, message: o.message, whatsappMessage: o.whatsappMessage || '', whatsappPhone: o.whatsappPhone || '918888888888', active: o.active, bgColor: o.bgColor || '#16a34a', startDate: o.startDate || '', endDate: o.endDate || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Offers</h1><p className="text-sm text-slate-400">{offers.length} offers</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Offer</button>
      </div>
      {loading && <TableSkeleton />}
      <div className="space-y-4">
        {offers.map(o => (
          <div key={o.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${o.active ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <h3 className="font-bold text-white">{o.title}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-2">{o.message}</p>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>WhatsApp: {o.whatsappPhone}</span>
                  {o.startDate && <span>From: {o.startDate}</span>}
                  {o.endDate && <span>Until: {o.endDate}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => toggleActive(o)} className={`text-sm cursor-pointer ${o.active ? 'text-amber-400' : 'text-green-400'}`}>{o.active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => openEdit(o)} className="text-sm text-blue-400 cursor-pointer">Edit</button>
                <button onClick={() => remove(o.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Offer' : 'Add Offer'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Summer Special Offer!" /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Popup Message</label><textarea className="input-field resize-none" rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Get 20% off on all courses this month!" /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">WhatsApp Phone (with country code)</label><input className="input-field" value={form.whatsappPhone} onChange={e => setForm({...form, whatsappPhone: e.target.value})} placeholder="918888888888" /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">WhatsApp Pre-filled Message</label><input className="input-field" value={form.whatsappMessage} onChange={e => setForm({...form, whatsappMessage: e.target.value})} placeholder="Hi! I want to enroll in the summer offer" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Bg Color</label><input type="color" className="input-field h-10" value={form.bgColor} onChange={e => setForm({...form, bgColor: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Start Date</label><input type="date" className="input-field" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">End Date</label><input type="date" className="input-field" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="rounded" />
            Active (show popup to visitors)
          </label>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Create'} Offer</button>
        </div>
      </Modal>
    </div>
  );
}
