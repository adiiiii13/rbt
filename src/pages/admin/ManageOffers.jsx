import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/contentApi';
import { addDocument, updateDocument, deleteDocument, uploadFile } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const emptyForm = {
  title: '',
  badge: 'LIMITED TIME',
  message: '',
  imageUrl: '',
  whatsappMessage: '',
  whatsappPhone: '918888888888',
  ctaText: 'Claim Offer',
  ctaLink: '',
  active: true,
  style: 'gradient', // 'gradient' | 'solid' | 'image'
  bgColor: '#16a34a',
  bgColor2: '#0ea5e9',
  textColor: '#ffffff',
  position: 'center', // 'center' | 'bottom-right' | 'top'
  startDate: '',
  endDate: '',
  priority: 0,
};

const PRESETS = [
  { name: 'Green Glow', bgColor: '#16a34a', bgColor2: '#10b981', textColor: '#fff' },
  { name: 'Sunset', bgColor: '#f97316', bgColor2: '#dc2626', textColor: '#fff' },
  { name: 'Ocean', bgColor: '#0ea5e9', bgColor2: '#6366f1', textColor: '#fff' },
  { name: 'Royal', bgColor: '#7c3aed', bgColor2: '#db2777', textColor: '#fff' },
  { name: 'Gold', bgColor: '#facc15', bgColor2: '#f59e0b', textColor: '#000' },
  { name: 'Mono', bgColor: '#1f2937', bgColor2: '#374151', textColor: '#fff' },
];

export default function ManageOffers() {
  const { data: offers, loading } = useRealtimeCollection('offers', 'createdAt', []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploading(true);
    try {
      const path = `public/offers/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadFile(path, file);
      setForm({ ...form, imageUrl: url });
      toast.success('Image uploaded');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    try {
      const payload = { ...form, priority: Number(form.priority) || 0 };
      if (editing) {
        await updateDocument('offers', editing.id, payload);
        toast.success('Offer updated');
      } else {
        await addDocument('offers', { ...payload, createdAt: new Date() });
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

  const bannerStyle = () => {
    if (form.style === 'image' && form.imageUrl) {
      return { backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${form.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: form.textColor };
    }
    if (form.style === 'gradient') {
      return { background: `linear-gradient(135deg, ${form.bgColor}, ${form.bgColor2})`, color: form.textColor };
    }
    return { background: form.bgColor, color: form.textColor };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Offers</h1><p className="text-sm text-slate-400">{offers.length} offers · banners</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Offer</button>
      </div>
      {loading && <TableSkeleton />}

      <div className="space-y-4">
        {offers.map(o => {
          const style = o.style === 'image' && o.imageUrl
            ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${o.imageUrl})`, backgroundSize: 'cover', color: o.textColor || '#fff' }
            : o.style === 'gradient'
            ? { background: `linear-gradient(135deg, ${o.bgColor || '#16a34a'}, ${o.bgColor2 || '#0ea5e9'})`, color: o.textColor || '#fff' }
            : { background: o.bgColor || '#16a34a', color: o.textColor || '#fff' };
          return (
            <div key={o.id} className="rounded-2xl overflow-hidden border border-slate-800">
              <div className="p-6 relative" style={style}>
                {o.badge && <span className="inline-block text-[10px] font-bold tracking-widest bg-black/30 px-2 py-1 rounded mb-2">{o.badge}</span>}
                <h3 className="font-bold text-2xl mb-1">{o.title}</h3>
                <p className="text-sm opacity-90 max-w-xl">{o.message}</p>
                {o.ctaText && <div className="mt-3 inline-block bg-black/30 hover:bg-black/40 px-4 py-2 rounded-lg text-sm font-bold">{o.ctaText} →</div>}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${o.active ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'}`} title={o.active ? 'Live' : 'Inactive'} />
                </div>
              </div>
              <div className="bg-[#111111] p-3 flex items-center justify-between text-xs">
                <div className="flex gap-3 text-slate-500">
                  <span>WhatsApp: {o.whatsappPhone}</span>
                  {o.startDate && <span>From: {o.startDate}</span>}
                  {o.endDate && <span>Until: {o.endDate}</span>}
                  <span>Priority: {o.priority || 0}</span>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button onClick={() => toggleActive(o)} className={`text-sm cursor-pointer ${o.active ? 'text-amber-400' : 'text-green-400'}`}>{o.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEdit(o)} className="text-sm text-blue-400 cursor-pointer">Edit</button>
                  <button onClick={() => remove(o.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Offer Banner' : 'Add Offer Banner'} size="lg">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Form */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Badge text (small label)</label>
              <input className="input-field" value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="LIMITED TIME" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summer Special 40% OFF" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Message *</label>
              <textarea rows={3} className="input-field resize-none" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Enroll now and unlock all courses..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">CTA Button Text</label>
                <input className="input-field" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} placeholder="Claim Offer" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">CTA Link (optional)</label>
                <input className="input-field" value={form.ctaLink} onChange={e => setForm({ ...form, ctaLink: e.target.value })} placeholder="/courses" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Style</label>
              <div className="grid grid-cols-3 gap-2">
                {['gradient', 'solid', 'image'].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, style: s })}
                    className={`py-2 rounded text-xs font-medium capitalize ${form.style === s ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {form.style === 'image' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Banner Image</label>
                <label className="border-2 border-dashed border-slate-600 rounded-lg p-3 text-center cursor-pointer hover:border-green-brand block">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="w-full h-24 object-cover rounded" />
                  ) : (
                    <p className="text-xs text-slate-400">{uploading ? 'Uploading...' : 'Click to upload (max 5MB)'}</p>
                  )}
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploading} />
                </label>
                <input className="input-field mt-2 text-xs" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="or paste URL" />
              </div>
            )}

            {form.style !== 'image' && (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Color presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => setForm({ ...form, bgColor: p.bgColor, bgColor2: p.bgColor2, textColor: p.textColor })}
                        className="rounded-lg p-2 text-xs font-bold border border-white/10 hover:scale-105 transition"
                        style={{ background: `linear-gradient(135deg, ${p.bgColor}, ${p.bgColor2})`, color: p.textColor }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs text-slate-400 block mb-1">Color 1</label>
                    <input type="color" className="input-field h-10 p-1" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} /></div>
                  {form.style === 'gradient' && (
                    <div><label className="text-xs text-slate-400 block mb-1">Color 2</label>
                      <input type="color" className="input-field h-10 p-1" value={form.bgColor2} onChange={e => setForm({ ...form, bgColor2: e.target.value })} /></div>
                  )}
                  <div><label className="text-xs text-slate-400 block mb-1">Text</label>
                    <input type="color" className="input-field h-10 p-1" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} /></div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Position</label>
                <select className="input-field" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="center">Center popup</option>
                  <option value="top">Top banner</option>
                  <option value="bottom-right">Bottom-right corner</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority (higher shows first)</label>
                <input type="number" className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-slate-400 block mb-1">Start Date</label>
                <input type="date" className="input-field" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className="text-xs text-slate-400 block mb-1">End Date</label>
                <input type="date" className="input-field" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>

            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp phone</label>
              <input className="input-field" value={form.whatsappPhone} onChange={e => setForm({ ...form, whatsappPhone: e.target.value })} /></div>
            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp pre-filled msg</label>
              <input className="input-field" value={form.whatsappMessage} onChange={e => setForm({ ...form, whatsappMessage: e.target.value })} /></div>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-green-brand" />
              Active (show to visitors)
            </label>
          </div>

          {/* Live preview */}
          <div>
            <div className="text-xs text-slate-400 mb-2 uppercase font-bold">Live Preview</div>
            <div className="rounded-2xl overflow-hidden p-6 relative min-h-[200px]" style={bannerStyle()}>
              {form.badge && <span className="inline-block text-[10px] font-bold tracking-widest bg-black/30 px-2 py-1 rounded mb-2">{form.badge}</span>}
              <h3 className="font-bold text-2xl mb-1">{form.title || 'Offer Title'}</h3>
              <p className="text-sm opacity-90">{form.message || 'Offer message goes here.'}</p>
              {form.ctaText && <div className="mt-3 inline-block bg-black/30 px-4 py-2 rounded-lg text-sm font-bold">{form.ctaText} →</div>}
            </div>
            <button onClick={save} disabled={uploading} className="btn-primary w-full mt-4 disabled:opacity-50">
              {editing ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
