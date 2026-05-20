import { useState, useMemo } from 'react'
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
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q))
  }, [students, search])

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
      setSearch('')
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDocument('notifications', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
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

      <Modal isOpen={modal} onClose={() => { setModal(false); setForm({ studentUid: '', studentName: '', subject: '', message: '' }); setSearch('') }} title="Send Notification">
        <div className="space-y-4">
          {/* Search + Dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-slate-300 mb-1 block">Select Student</label>
            <div className="relative">
              <input
                className="input-field"
                placeholder="Search by name, email, or ID..."
                value={form.studentUid ? `${form.studentName} (${form.studentUid})` : search}
                onChange={e => {
                  setSearch(e.target.value)
                  setDropdownOpen(true)
                  if (!e.target.value) setForm({ ...form, studentUid: '', studentName: '' })
                }}
                onFocus={() => { if (!form.studentUid) setDropdownOpen(true) }}
              />
              {form.studentUid && (
                <button
                  onClick={() => { setForm({ ...form, studentUid: '', studentName: '' }); setSearch(''); setDropdownOpen(true) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >✕</button>
              )}
            </div>
            {dropdownOpen && !form.studentUid && filteredStudents.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#111111] border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredStudents.slice(0, 20).map(s => (
                  <button
                    key={s.id || s.uid}
                    onClick={() => {
                      setForm({ ...form, studentUid: s.id || s.uid, studentName: s.name })
                      setSearch('')
                      setDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-white text-sm">{s.name}</span>
                    <span className="text-slate-500 text-xs">{s.email || s.studentId || s.id}</span>
                  </button>
                ))}
              </div>
            )}
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
