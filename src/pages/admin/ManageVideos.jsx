import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react'
import { deleteItemSmart } from '../../lib/contentApi'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers'
import { defaultVideos } from '../../data/videos'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const emptyForm = { title: '', subject: '', class: 'Class 11', duration: '', teacher: '', videoUrl: '', thumbnailUrl: '', isFree: true, price: 0 }

export default function ManageVideos() {
  const { data: videosRaw, loading } = useRealtimeCollection('videos', { fallback: defaultVideos })
  const videos = videosRaw?.length ? videosRaw : defaultVideos
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [inputMode, setInputMode] = useState('url') // 'url' or 'file'

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { toast.error('Video files only'); return }
    if (file.size > 500 * 1024 * 1024) { toast('Large file — upload may take time', { icon: 'info' }) }
    setUploading(true)
    try {
      const path = `videos/${Date.now()}_${file.name}`
      const url = await uploadFile(path, file)
      setForm({ ...form, videoUrl: url })
      toast.success('Video uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Image only'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const path = `videos/thumbs/${Date.now()}_${file.name}`
      const url = await uploadFile(path, file)
      setForm({ ...form, thumbnailUrl: url })
      toast.success('Thumbnail uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.title || !form.videoUrl) { toast.error('Title and Video URL required'); return }
    const data = { ...form, price: form.isFree ? 0 : Number(form.price), views: editing?.views || 0 }
    try {
      if (editing) {
        await updateDocument('videos', editing.id, data)
        toast.success('Updated')
      } else {
        await addDocument('videos', data)
        toast.success('Added')
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteItemSmart('videos', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (v) => {
    setEditing(v)
    setForm({ title: v.title, subject: v.subject, class: v.class, duration: v.duration, teacher: v.teacher, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl || '', isFree: v.isFree !== false, price: v.price || 0 })
    setInputMode(v.videoUrl && (v.videoUrl.includes('youtube.com') || v.videoUrl.includes('youtu.be')) ? 'url' : 'file')
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setInputMode('url') }

  const deleteAll = async () => {
    if (!confirm(`Delete ALL ${videos.length} videos? This cannot be undone.`)) return
    try {
      await Promise.all(videos.map(v => deleteItemSmart('videos', v.id)))
      toast.success('All videos deleted')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Videos</h1><p className="text-sm text-slate-400">{videos.length} videos</p></div>
        <div className="flex gap-3">
          {videos.length > 0 && <button onClick={deleteAll} className="btn-danger text-sm">Delete All</button>}
          <button onClick={() => setModal(true)} className="btn-primary">+ Add Video</button>
        </div>
      </div>
      {loading && <TableSkeleton />}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th className="text-white">Title</th><th className="text-white">Subject</th><th className="text-white">Class</th><th className="text-white">Type</th><th className="text-white">Views</th><th className="text-white">Actions</th></tr></thead>
            <tbody>{videos.map(v => (
              <tr key={v.id}>
                <td className="font-medium text-white">{v.title}</td>
                <td>{v.subject}</td>
                <td>{v.class}</td>
                <td><span className={`badge ${v.isFree !== false ? 'badge-green' : 'badge-gold'}`}>{v.isFree !== false ? 'Free' : 'Paid'}</span></td>
                <td>{v.views || 0}</td>
                <td><div className="flex gap-2"><button onClick={() => openEdit(v)} className="text-sm text-blue-400 cursor-pointer">Edit</button><button onClick={() => remove(v.id)} className="text-sm text-red-400 cursor-pointer">Delete</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4 p-1">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label><input className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Class</label><select className="input-field" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>{['Class 8','Class 9','Class 10','Class 11','Class 12','JEE','NEET'].map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Duration</label><input className="input-field" placeholder="45 min" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Teacher</label><input className="input-field" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} /></div>
          </div>

          {/* Video Source Toggle */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setInputMode('url')} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${inputMode === 'url' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-slate-700'}`}>
              YouTube URL
            </button>
            <button type="button" onClick={() => setInputMode('file')} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${inputMode === 'file' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-slate-700'}`}>
              Upload Video
            </button>
          </div>

          {inputMode === 'url' ? (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">YouTube URL</label>
              <input className="input-field" placeholder="https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
              <p className="text-xs text-slate-500 mt-1">Paste any YouTube link (watch, share, or embed)</p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Upload Video (files over 500MB may take time)</label>
              <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
                {form.videoUrl && !form.videoUrl.includes('youtube') ? (
                  <p className="text-sm text-green-brand">{form.videoUrl.split('/').pop().split('?')[0]}</p>
                ) : (
                  <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to select video file'}</p>
                )}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploading} />
              </label>
              <p className="text-xs text-slate-500 mt-1">MP4, WebM, MOV supported. Large files take time to upload.</p>
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Thumbnail (optional)</label>
            <div className="flex gap-3">
              <label className="border-2 border-dashed border-slate-600 rounded-xl p-3 text-center cursor-pointer hover:border-green-brand transition-colors flex-shrink-0 w-32">
                {form.thumbnailUrl ? (
                  <img src={form.thumbnailUrl} alt="" className="w-full h-16 object-cover rounded" />
                ) : (
                  <p className="text-xs text-slate-400 mt-3">{uploading ? '...' : 'Upload'}</p>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
              </label>
              <input className="input-field flex-1" placeholder="or paste thumbnail URL" value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div><p className="text-sm font-medium text-white">Free or Paid?</p><p className="text-xs text-slate-400">{form.isFree ? 'Anyone can watch' : 'Requires payment'}</p></div>
            <button type="button" onClick={() => setForm({...form, isFree: !form.isFree})} className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${form.isFree ? 'bg-green-brand' : 'bg-amber-500'}`}><span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow ${form.isFree ? 'left-0.5' : 'left-7'}`} /></button>
          </div>
          {!form.isFree && <div><label className="text-sm font-medium text-slate-300 mb-1 block">Price (INR)</label><input type="number" className="input-field" placeholder="99" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>}
          <button onClick={save} disabled={uploading} className="btn-primary w-full disabled:opacity-50">{editing ? 'Update' : 'Add'} Video</button>
        </div>
      </Modal>
    </div>
  )
}
