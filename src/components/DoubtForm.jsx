import { useState } from 'react'
import toast from 'react-hot-toast'
import { addDocument } from '../lib/firebaseHelpers'
import { uploadFile } from '../lib/firebaseHelpers'
import { useAuth } from '../context/AuthContext'

export default function DoubtForm({ onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ text: '', subject: '' })
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const path = `doubts/${user?.uid || 'anon'}/${Date.now()}_${file.name}`
      const url = await uploadFile(path, file)
      setImageUrl(url)
      toast.success('Image uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.text && !imageUrl) { toast.error('Add question text or image'); return }
    setSubmitting(true)
    try {
      await addDocument('doubts', {
        studentName: user?.name || 'Anonymous',
        studentEmail: user?.email || '',
        studentUid: user?.uid || '',
        studentType: user?.batch ? 'Batch Student' : 'Basic Student',
        subject: form.subject,
        text: form.text,
        imageUrl: imageUrl,
        status: 'pending',
        adminReply: '',
      })
      setSubmitted(true)
      toast.success('Doubt submitted')
      if (onSuccess) onSuccess()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-brand/20 flex items-center justify-center text-green-brand mx-auto text-xl">✓</div>
        <h3 className="text-white font-bold">Doubt Submitted!</h3>
        <p className="text-sm text-slate-400">Admin will respond soon. Check your doubts list for updates.</p>
        <button onClick={() => { setSubmitted(false); setForm({ text: '', subject: '' }); setImageUrl('') }} className="text-sm text-green-brand cursor-pointer mt-2">Ask another doubt</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label>
        <input className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Physics, Chemistry, Maths..." />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">Your Question *</label>
        <textarea className="input-field resize-none" rows={4} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Type your doubt here..." />
      </div>

      {/* Photo upload */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">Photo (optional)</label>
        <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
          {imageUrl ? (
            <img src={imageUrl} alt="Doubt" className="w-full max-h-40 object-contain mx-auto rounded-lg" />
          ) : (
            <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to add photo of question (max 5MB)'}</p>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>
      </div>

      <button type="submit" disabled={submitting || uploading} className="btn-primary w-full disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Doubt'}
      </button>
    </form>
  )
}
