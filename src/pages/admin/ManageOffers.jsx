import { TableSkeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const emptyForm = {
  title: '', badge: 'LIMITED TIME', message: '',
  whatsappMessage: '', whatsappPhone: '918888888888',
  ctaText: 'Enquire on WhatsApp', active: true,
  template: 'classic', bgColor: '#16a34a', bgColor2: '#0ea5e9',
}

const TEMPLATES = [
  { id: 'classic', name: 'Classic Popup', desc: 'Centered gradient popup — smooth slide-up', icon: '🎯', preview: 'from-green-500 to-emerald-600' },
  { id: 'fullscreen', name: 'Fullscreen Takeover', desc: 'Full-screen dramatic overlay — big impact', icon: '🌟', preview: 'from-blue-500 to-indigo-600' },
  { id: 'bottombar', name: 'Bottom Bar', desc: 'Fixed bar at bottom — non-intrusive like mobile notifications', icon: '📢', preview: 'from-orange-500 to-red-500' },
  { id: 'side', name: 'Side Panel', desc: 'Slides in from right side — like a drawer', icon: '⚡', preview: 'from-purple-500 to-pink-500' },
  { id: 'split', name: 'Split Banner', desc: 'Left visual + right text — modern split layout', icon: '🧩', preview: 'from-teal-500 to-cyan-500' },
]

const COLOR_PRESETS = [
  { name: 'Green', bg: '#16a34a', bg2: '#10b981' },
  { name: 'Sunset', bg: '#f97316', bg2: '#dc2626' },
  { name: 'Ocean', bg: '#0ea5e9', bg2: '#6366f1' },
  { name: 'Royal', bg: '#7c3aed', bg2: '#db2777' },
  { name: 'Gold', bg: '#facc15', bg2: '#f59e0b' },
]

export default function ManageOffers() {
  const { data: offers, loading } = useRealtimeCollection('offers')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const save = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return }
    try {
      if (editing) {
        await updateDocument('offers', editing.id, form)
        toast.success('Offer updated')
      } else {
        await addDocument('offers', { ...form, createdAt: new Date() })
        toast.success('Offer created')
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const toggleActive = async (o) => {
    try { await updateDocument('offers', o.id, { active: !o.active }); toast.success(o.active ? 'Deactivated' : 'Activated') }
    catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDocument('offers', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (o) => { setEditing(o); setForm({ ...emptyForm, ...o }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Offers</h1><p className="text-sm text-slate-400">{offers.length} offers</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Offer</button>
      </div>
      {loading && <TableSkeleton />}

      {/* Active offers */}
      <div className="space-y-4">
        {offers.map(o => {
          const tmpl = TEMPLATES.find(t => t.id === o.template) || TEMPLATES[0]
          return (
            <div key={o.id} className="rounded-2xl overflow-hidden border border-slate-800">
              <div className="p-6 relative text-white"
                style={{ background: `linear-gradient(135deg, ${o.bgColor || '#16a34a'}, ${o.bgColor2 || '#0ea5e9'})` }}>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${o.active ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-500'}`} />
                  <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-bold">{tmpl.icon} {tmpl.name}</span>
                </div>
                {o.badge && <span className="inline-block text-[10px] font-bold tracking-widest bg-black/30 px-2 py-1 rounded mb-2">{o.badge}</span>}
                <h3 className="font-bold text-2xl mb-1">{o.title}</h3>
                <p className="text-sm opacity-90 max-w-xl">{o.message}</p>
              </div>
              <div className="bg-[#111111] p-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">WhatsApp: {o.whatsappPhone}</span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(o)} className={`cursor-pointer ${o.active ? 'text-amber-400' : 'text-green-400'}`}>{o.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEdit(o)} className="text-blue-400 cursor-pointer">Edit</button>
                  <button onClick={() => remove(o.id)} className="text-red-400 cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Offer' : 'Add Offer'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Text fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 block mb-1">Badge</label><input className="input-field" value={form.badge} onChange={e => setForm({...form, badge: e.target.value})} /></div>
            <div><label className="text-xs text-slate-400 block mb-1">CTA Button Text</label><input className="input-field" value={form.ctaText} onChange={e => setForm({...form, ctaText: e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-slate-400 block mb-1">Title *</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-xs text-slate-400 block mb-1">Message *</label><textarea rows={2} className="input-field resize-none" value={form.message} onChange={e => setForm({...form, message: e.target.value})} /></div>

          {/* Template picker — visual cards */}
          <div>
            <label className="text-xs text-slate-400 block mb-2 uppercase font-bold">Choose Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setForm({...form, template: t.id})}
                  className={`rounded-2xl p-4 text-left transition-all cursor-pointer border-2 ${
                    form.template === t.id ? 'border-green-brand bg-green-brand/10' : 'border-transparent bg-white/5 hover:bg-white/10'
                  }`}>
                  <div className={`w-full aspect-video rounded-xl bg-gradient-to-br ${t.preview} flex items-center justify-center mb-3`}>
                    <span className="text-3xl">{t.icon}</span>
                  </div>
                  <p className="text-white text-sm font-bold">{t.name}</p>
                  <p className="text-slate-400 text-[10px] mt-1 leading-tight">{t.desc}</p>
                  {form.template === t.id && (
                    <div className="mt-2 flex items-center gap-1 text-green-brand text-xs font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs text-slate-400 block mb-2 uppercase font-bold">Colors</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map(p => (
                <button key={p.name} onClick={() => setForm({...form, bgColor: p.bg, bgColor2: p.bg2})}
                  className="h-10 w-20 rounded-lg border-2 border-transparent hover:border-white/30 cursor-pointer flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }}>
                  <span className="text-white text-[10px] font-bold">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-slate-500">Primary</label><input type="color" className="input-field h-10 w-full" value={form.bgColor} onChange={e => setForm({...form, bgColor: e.target.value})} /></div>
              <div><label className="text-[10px] text-slate-500">Secondary</label><input type="color" className="input-field h-10 w-full" value={form.bgColor2} onChange={e => setForm({...form, bgColor2: e.target.value})} /></div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp Phone</label><input className="input-field" value={form.whatsappPhone} onChange={e => setForm({...form, whatsappPhone: e.target.value})} /></div>
            <div><label className="text-xs text-slate-400 block mb-1">WhatsApp Message</label><input className="input-field" value={form.whatsappMessage} onChange={e => setForm({...form, whatsappMessage: e.target.value})} /></div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="accent-green-brand" />
            Active (show on website)
          </label>

          <button onClick={save} className="btn-primary w-full">{editing ? 'Update Offer' : 'Create Offer'}</button>
        </div>
      </Modal>
    </div>
  )
}
