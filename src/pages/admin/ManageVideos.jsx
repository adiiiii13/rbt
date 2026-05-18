import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import FileUpload from '../../components/FileUpload'
import { getCollection, addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'

export default function ManageVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '', subject: '', class: 'Class 11', duration: '', teacher: '',
    videoUrl: '#', thumbnailUrl: '', isFree: true, price: 0
  })

  useEffect(() => { loadVideos() }, [])

  const loadVideos = async () => {
    setLoading(true)
    try {
      const data = await getCollection('videos')
      setVideos(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const save = async () => {
    const data = {
      ...form,
      price: form.isFree ? 0 : Number(form.price),
      views: editing?.views || 0,
    }
    if (editing) {
      await updateDocument('videos', editing.id, data)
    } else {
      await addDocument('videos', data)
    }
    closeModal()
    loadVideos()
  }

  const remove = async (id) => {
    await deleteDocument('videos', id)
    loadVideos()
  }

  const openEdit = (v) => {
    setEditing(v)
    setForm({
      title: v.title, subject: v.subject, class: v.class, duration: v.duration,
      teacher: v.teacher, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl || '',
      isFree: v.isFree !== false, price: v.price || 0
    })
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setEditing(null)
    setForm({
      title: '', subject: '', class: 'Class 11', duration: '', teacher: '',
      videoUrl: '#', thumbnailUrl: '', isFree: true, price: 0
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Videos</h1>
          <p className="text-sm text-slate-400">{videos.length} videos</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Video</button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Title</th>
                  <th className="text-white">Subject</th>
                  <th className="text-white">Class</th>
                  <th className="text-white">Teacher</th>
                  <th className="text-white">Type</th>
                  <th className="text-white">Price</th>
                  <th className="text-white">Views</th>
                  <th className="text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td className="font-medium text-white">{v.title}</td>
                    <td>{v.subject}</td>
                    <td>{v.class}</td>
                    <td>{v.teacher}</td>
                    <td>
                      <span className={`badge ${v.isFree !== false ? 'badge-green' : 'badge-gold'}`}>
                        {v.isFree !== false ? 'Free' : 'Paid'}
                      </span>
                    </td>
                    <td className="text-green-brand">
                      {v.isFree === false ? formatCurrency(v.price) : '-'}
                    </td>
                    <td>{v.views || 0}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="text-sm text-blue-600 cursor-pointer">Edit</button>
                        <button onClick={() => remove(v.id)} className="text-sm text-red-600 cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4 p-1">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Title</label>
            <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label>
              <input className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Class</label>
              <select className="input-field" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>
                {['Class 8','Class 9','Class 10','Class 11','Class 12','JEE','NEET'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Duration</label>
              <input className="input-field" placeholder="e.g. 45 min" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Teacher</label>
              <input className="input-field" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Video URL</label>
            <input className="input-field" placeholder="YouTube or video link" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
          </div>

          <FileUpload
            path="images/videos"
            accept="image/*"
            label="Thumbnail Image"
            currentUrl={form.thumbnailUrl}
            onUpload={(url) => setForm({ ...form, thumbnailUrl: url })}
          />

          {/* Free/Paid Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Video Type</p>
              <p className="text-xs text-slate-400">
                {form.isFree ? 'Anyone can watch for free' : 'Requires payment to unlock'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isFree: !form.isFree })}
              className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                form.isFree ? 'bg-green-brand' : 'bg-amber-500'
              }`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${
                form.isFree ? 'left-0.5' : 'left-7.5'
              }`} />
            </button>
          </div>

          {!form.isFree && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Price (INR)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 99"
                value={form.price}
                onChange={e => setForm({...form, price: e.target.value})}
              />
            </div>
          )}

          <button onClick={save} className="btn-primary w-full">
            {editing ? 'Update' : 'Add'} Video
          </button>
        </div>
      </Modal>
    </div>
  )
}
