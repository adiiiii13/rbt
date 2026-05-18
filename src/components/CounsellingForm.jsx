import { useState } from 'react'
import toast from 'react-hot-toast'
import { addDocument } from '../lib/firebaseHelpers'

const PHONE_RE = /^[0-9+\-\s()]{7,15}$/
const RATE_KEY = 'rbt_counselling_last'
const RATE_MS = 60_000

const timeSlots = [
  '9:00 AM - 12:00 PM',
  '2:00 PM - 5:00 PM',
  '5:00 PM - 8:00 PM',
]

const topics = [
  'Academic Performance',
  'Career Guidance',
  'Personal Issues',
  'Admission Query',
  'Fee Related',
  'Other',
]

export default function CounsellingForm({ onSuccess, compact = false }) {
  const [form, setForm] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    topic: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleaned = {
      studentName: form.studentName.trim(),
      parentName: form.parentName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      topic: form.topic,
    }
    if (!cleaned.studentName || !cleaned.phone || !cleaned.preferredDate || !cleaned.preferredTime || !cleaned.topic) {
      setError('Please fill all required fields')
      return
    }
    if (!PHONE_RE.test(cleaned.phone)) {
      setError('Invalid phone number')
      return
    }
    if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      setError('Invalid email')
      return
    }
    const last = Number(localStorage.getItem(RATE_KEY) || 0)
    if (Date.now() - last < RATE_MS) {
      setError('Please wait a minute before submitting again')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addDocument('counsellingBookings', {
        ...cleaned,
        status: 'pending',
        meetingLink: '',
      })
      localStorage.setItem(RATE_KEY, String(Date.now()))
      setSubmitted(true)
      toast.success('Booking submitted')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('[counselling]', err)
      setError('Failed to submit. Try again.')
      toast.error('Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-green-brand/20 flex items-center justify-center text-green-brand mx-auto text-2xl">✓</div>
        <h3 className="text-lg font-bold text-white">Booking Submitted!</h3>
        <p className="text-sm text-slate-400">We'll contact you soon to confirm your counselling session.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className={compact ? '' : 'grid grid-cols-2 gap-4'}>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Student Name *</label>
          <input className="input-field" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} required />
        </div>
        {!compact && (
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Parent Name</label>
            <input className="input-field" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Phone *</label>
          <input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Email</label>
          <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>

      {compact && (
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Parent Name</label>
          <input className="input-field" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Preferred Date *</label>
          <input type="date" className="input-field" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Time Slot *</label>
          <select className="input-field" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} required>
            <option value="">Select</option>
            {timeSlots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">Topic *</label>
        <select className="input-field" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required>
          <option value="">Select topic</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting...' : 'Book Counselling Session'}
      </button>
    </form>
  )
}
