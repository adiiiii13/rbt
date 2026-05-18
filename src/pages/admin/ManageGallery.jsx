import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/contentApi'
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const emptyForm = { title: '', category: 'Campus', imageUrl: '' }

export default function ManageGallery() {
  const { data: images, loading } = useRealtimeCollection('gallery', 'createdAt', [])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const save = async () => {
    if (!form.imageUrl) { toast.error('Paste an image URL'); return }
    try {
      if (editing) {
        await updateDocument('gallery', editing.id, form)
        toast.success('Updated')
      } else {
        await addDocument('gallery', form)
        toast.success('Added')
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDocument('gallery', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (img) => { setEditing(img); setForm({ title: img.title, category: img.category, imageUrl: img.imageUrl }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Gallery</h1><p className="text-sm text-slate-400">{images.length} images</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Image</button>
      </div>
      {loading && <div className="text-slate-400 text-sm mb-4">Loading...</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.id} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden group">
            <div className="aspect-video relative">
              <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => openEdit(img)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">Edit</button>
                <button onClick={() => remove(img.id)} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">Delete</button>
              </div>
            </div>
            <div className="p-3"><p className="text-sm font-medium text-white">{img.title}</p><span className="badge badge-green text-xs mt-1">{img.category}</span></div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Image' : 'Add Image'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Category</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{['Campus', 'Labs', 'Events', 'Facilities', 'Students'].map(c => <option key={c}>{c}</option>)}</select></div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Image URL</label>
            <input className="input-field" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://... image link" />
            <p className="text-xs text-slate-500 mt-1">Paste any image URL (Google Drive, Imgur, etc.)</p>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Image</button>
        </div>
      </Modal>
    </div>
  )
}
