import { useState } from 'react'
import { useRealtimeCollection, deleteItemSmart } from '../../lib/contentApi'
import { addDocument, updateDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const emptyForm = { title: '', category: 'Campus', imageUrl: '' }

// Compress image to JPEG base64, max 800x600
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const maxW = 800, maxH = 600
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function ManageGallery() {
  const { data: images, loading } = useRealtimeCollection('gallery', 'createdAt', [])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      setForm({ ...form, imageUrl: compressed })
      setPreview(compressed)
      toast.success('Image ready')
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.imageUrl) { toast.error('Upload or paste image URL'); return }
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
    try { await deleteItemSmart('gallery', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (img) => {
    setEditing(img)
    setForm({ title: img.title, category: img.category, imageUrl: img.imageUrl })
    setPreview(img.imageUrl)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setPreview('') }

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

          {/* Upload file */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Upload Image</label>
            <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full max-h-40 object-contain mx-auto rounded-lg" />
              ) : (
                <p className="text-sm text-slate-400">{uploading ? 'Processing...' : 'Click to select image (max 5MB)'}</p>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {/* Or paste URL */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-3 text-slate-500 text-xs">or paste URL</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <input className="input-field" value={form.imageUrl} onChange={e => { setForm({...form, imageUrl: e.target.value}); setPreview(e.target.value); }} placeholder="https://... image link" />

          <button onClick={save} disabled={uploading} className="btn-primary w-full disabled:opacity-50">{editing ? 'Update' : 'Add'} Image</button>
        </div>
      </Modal>
    </div>
  )
}
