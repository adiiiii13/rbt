import { useState, useEffect } from 'react'
import { getCollection, addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import FileUpload from '../../components/FileUpload'
import Modal from '../../components/Modal'

export default function ManageGallery() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', category: 'Campus', imageUrl: '' })

  useEffect(() => { loadImages() }, [])

  const loadImages = async () => {
    setLoading(true)
    try {
      const data = await getCollection('gallery')
      setImages(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!form.imageUrl) return
    if (editing) {
      await updateDocument('gallery', editing.id, form)
    } else {
      await addDocument('gallery', form)
    }
    closeModal()
    loadImages()
  }

  const remove = async (id) => {
    await deleteDocument('gallery', id)
    loadImages()
  }

  const openEdit = (img) => {
    setEditing(img)
    setForm({ title: img.title, category: img.category, imageUrl: img.imageUrl })
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setEditing(null)
    setForm({ title: '', category: 'Campus', imageUrl: '' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Gallery</h1>
          <p className="text-sm text-slate-400">{images.length} images</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Image</button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden group">
              <div className="aspect-video relative">
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => openEdit(img)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">Edit</button>
                  <button onClick={() => remove(img.id)} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">Delete</button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-white">{img.title}</p>
                <span className="badge badge-green text-xs mt-1">{img.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Image' : 'Add Image'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Campus', 'Labs', 'Events', 'Facilities', 'Students'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <FileUpload
            path="images/gallery"
            accept="image/*"
            label="Gallery Image"
            currentUrl={form.imageUrl}
            onUpload={(url) => setForm({ ...form, imageUrl: url })}
          />
          <button onClick={save} className="btn-primary w-full">
            {editing ? 'Update' : 'Add'} Image
          </button>
        </div>
      </Modal>
    </div>
  )
}
