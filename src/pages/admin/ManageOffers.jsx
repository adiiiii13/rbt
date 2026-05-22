import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const emptyForm = {
  title: '',
  badge: 'LIMITED TIME',
  message: '',
  whatsappMessage: '',
  whatsappPhone: '918888888888',
  ctaText: 'Enquire on WhatsApp',
  active: true,
  template: 'classic',
  bgColor: '#16a34a',
  bgColor2: '#0ea5e9',
};

const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Centered popup with gradient', icon: '🎯', color: 'from-green-500 to-emerald-600' },
  { id: 'fullscreen', name: 'Fullscreen', desc: 'Big dramatic overlay', icon: '🌟', color: 'from-blue-500 to-indigo-600' },
  { id: 'bottombar', name: 'Bottom Bar', desc: 'Slides up from bottom', icon: '📢', color: 'from-orange-500 to-red-500' },
  { id: 'side', name: 'Side Panel', desc: 'Slides in from right side', icon: '⚡', color: 'from-purple-500 to-pink-500' },
  { id: 'card', name: 'Dark Card', desc: 'Dark card with color accent strip', icon: '💎', color: 'from-teal-500 to-cyan-500' },
];

const COLOR_PRESETS = [
  { name: 'Green', bg: '#16a34a', bg2: '#10b981' },
  { name: 'Sunset', bg: '#f97316', bg2: '#dc2626' },
  { name: 'Ocean', bg: '#0ea5e9', bg2: '#6366f1' },
  { name: 'Royal', bg: '#7c3aed', bg2: '#db2777' },
  { name: 'Gold', bg: '#facc15', bg2: '#f59e0b' },
];

export default function ManageOffers() {
  const { data: offers, loading } = useRealtimeCollection('offers');
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
        await addDocument('offers', { ...form, createdAt: new Date() });
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

  const openEdit = (o) => { setEditing(o); setForm({ ...emptyForm, ...o }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const gradientStyle = (bg, bg2) => ({ background: `linear-gradient(135deg, ${bg}, ${bg2})` });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Offers</h1><p className="text-sm text-slate-400">{offers.length} offers</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Offer</button>
      </div>
      {loading && <TableSkeleton />}

      {/* Template gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {TEMPLATES.map(t => (
          <div key={t.id} className={`bg-gradient-to-br ${t.color} rounded-xl p-3 text-center`}>
            <span className="text-2xl block mb-1">{t.icon}</span>
            <p className="text-white text-xs font-bold">{t.name}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {offers.map(o => (
          <div key={o.id} className="rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-6 relative text-white" style={gradientStyle(o.bgColor || '#16a34a', o.bgColor2 || '#0ea5e9')}>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${o.active ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'}`} />
                <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-bold">{TEMPLATES.find(t => t.id === o.template)?.name || 'Classic'}</span>
              </div>
              {o.badge && <span className="inline-block text-[10px] font-bold tracking-widest bg-black/30 px-2 py-1 rounded mb-2">{o.badge}</span>}
              <h3 className="font-bold text-2xl mb-1">{o.title}</h3>
              <p className="text-sm opacity-90 max-w-xl">{o.message}</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg text-sm font-bold">
                {o.ctaText} →
              </div>
            </div>
            <div className="bg-[#111111] p-3 flex items-center justify-between text-xs">
              <div className="flex gap-3 text-slate-500">
                <span>WhatsApp: {o.whatsappPhone}</span>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Offer' : 'Add Offer'} size="lg">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Form */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Badge text</label>
              <input className="input-field" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="LIMITED TIME" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summer Special 40% OFF" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Message *</label>
              <textarea rows={3} className="input-field resize-none" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Enroll now and unlock all courses..." />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">CTA Button Text</label>
              <input className="input-field" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} />
            </div>

            {/* Template picker */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Template (popup design)</label>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setForm({ ...form, template: t.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                      form.template === t.id ? 'bg-green-brand/15 border-2 border-green-brand' : 'bg-white/5 border-2 border-transparent hover:border-white/10'
                    }`}>
                    <span className="text-2xl shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">{t.name}</p>
                      <p className="text-slate-400 text-xs">{t.desc}</p>
                    </div>
                    {form.template === t.id && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-brand shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Colors</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COLOR_PRESETS.map(p => (
                  <button key={p.name} type="button" onClick={() => setForm({ ...form, bgColor: p.bg, bgColor2: p.bg2 })}
                    className="h-8 w-16 rounded-lg border-2 border-transparent hover:border-white/30 cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }} title={p.name} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-slate-500">Primary</label><input type="color" className="input-field h-8 w-full" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} /></div>
                <div><label className="text-[10px] text-slate-500">Secondary</label><input type="color" className="input-field h-8 w-full" value={form.bgColor2} onChange={e => setForm({ ...form, bgColor2: e.target.value })} /></div>
              </div>
            </div>

            {/* WhatsApp */}
            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp phone</label>
              <input className="input-field" value={form.whatsappPhone} onChange={e => setForm({ ...form, whatsappPhone: e.target.value })} placeholder="918888888888" /></div>
            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp pre-filled msg</label>
              <input className="input-field" value={form.whatsappMessage} onChange={e => setForm({ ...form, whatsappMessage: e.target.value })} placeholder="Hi! I want the summer offer" /></div>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-green-brand" />
              Active (show to visitors)
            </label>
          </div>

          {/* Preview */}
          <div>
            <div className="text-xs text-slate-400 mb-2 uppercase font-bold">Preview</div>
            <div className="rounded-2xl overflow-hidden p-8 min-h-[200px] text-white flex flex-col items-center justify-center text-center"
              style={gradientStyle(form.bgColor, form.bgColor2)}>
              {form.badge && <span className="inline-block text-[10px] font-bold tracking-widest bg-black/30 px-2 py-1 rounded mb-3">{form.badge}</span>}
              <h3 className="font-bold text-2xl mb-2">{form.title || 'Offer Title'}</h3>
              <p className="text-sm opacity-90 mb-4">{form.message || 'Offer message goes here.'}</p>
              <span className="inline-block bg-black/30 px-4 py-2 rounded-lg text-sm font-bold">{form.ctaText || 'Enquire'} →</span>
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">
              Template: {TEMPLATES.find(t => t.id === form.template)?.name || 'Classic'}
            </div>
            <button onClick={save} className="btn-primary w-full mt-4">
              {editing ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
