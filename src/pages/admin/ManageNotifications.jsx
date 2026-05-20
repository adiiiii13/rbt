import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageNotifications() {
  const { data: notifications, loading } = useRealtimeCollection('notifications', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ studentUid: '', studentName: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!form.studentUid || !form.subject || !form.message) { toast.error('All fields required'); return }
    setSending(true)
    try {
      await addDocument('notifications', {
        studentUid: form.studentUid,
        studentName: form.studentName,
        subject: form.subject,
        message: form.message,
        read: false,
      })
      toast.success('Notification sent')
      setModal(false)
      setForm({ studentUid: '', studentName: '', subject: '', message: '' })
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDocument('notifications', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const selectStudent = (s) => {
    setForm({ ...form, studentUid: s.id || s.uid, studentName: s.name })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Send Notifications</h1><p className="text-sm text-slate-400">{notifications.length} sent</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Send Notification</button>
      </div>
      {loading && <p className="text-slate-400 text-sm mb-4">Loading...</p>}
      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">{n.subject}</span>
                  <span className={`badge text-xs ${n.read ? 'badge-navy' : 'badge-gold'}`}>{n.read ? 'Read' : 'Unread'}</span>
                </div>
                <p className="text-xs text-slate-500">To: {n.studentName} ({n.studentUid})</p>
              </div>
              <button onClick={() => remove(n.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
            </div>
            <p className="text-sm text-slate-300">{n.message}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); setForm({ studentUid: '', studentName: '', subject: '', message: '' }) }} title="Send Notification">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Select Student</label>
            <select className="input-field" value={form.studentUid} onChange={e => {
              const s = students.find(st => (st.id || st.uid) === e.target.value)
              if (s) selectStudent(s)
              else setForm({ ...form, studentUid: e.target.value, studentName: e.target.value })
            }}>
              <option value="">Choose student...</option>
              {students.map(s => <option key={s.id || s.uid} value={s.id || s.uid}>{s.name} ({s.email || s.id})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label>
            <input className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Fee reminder, Performance update..." />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Message</label>
            <textarea className="input-field resize-none" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your message..." />
          </div>
          <button onClick={send} disabled={sending} className="btn-primary w-full disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
