import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageNotifications() {
  const { data: notifications, loading } = useRealtimeCollection('notifications', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [audience, setAudience] = useState('specific') // 'specific' | 'all' | 'class'
  const [classFilter, setClassFilter] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  const classes = useMemo(() => {
    const set = new Set(students.map(s => s.class).filter(Boolean));
    return Array.from(set).sort();
  }, [students])

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q)
    )
  }, [students, search])

  const recipients = useMemo(() => {
    if (audience === 'all') return students
    if (audience === 'class') return students.filter(s => s.class === classFilter)
    return students.filter(s => selectedIds.has(s.id || s.uid))
  }, [audience, students, selectedIds, classFilter])

  const toggleSelect = (id) => {
    setSelectedIds(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredStudents.map(s => s.id || s.uid)))
  }

  const send = async () => {
    if (!form.subject || !form.message) { toast.error('Subject and message required'); return }
    if (recipients.length === 0) { toast.error('No recipients selected'); return }
    if (recipients.length > 50 && !confirm(`Send to ${recipients.length} students?`)) return
    setSending(true)
    try {
      // Write one notification doc per recipient — keeps the existing
      // student-side `where('studentUid', '==', uid)` query simple and back-compatible.
      await Promise.all(recipients.map(s => addDocument('notifications', {
        studentUid: s.id || s.uid,
        studentName: s.name || '',
        studentEmail: s.email || '',
        subject: form.subject,
        message: form.message,
        audience,
        read: false,
        createdAt: new Date(),
      })))
      toast.success(`Sent to ${recipients.length} student${recipients.length > 1 ? 's' : ''}`)
      closeModal()
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const closeModal = () => {
    setModal(false)
    setForm({ subject: '', message: '' })
    setSelectedIds(new Set())
    setSearch('')
    setAudience('specific')
    setClassFilter('')
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDocument('notifications', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  // Group sent notifications by subject + createdAt for cleaner display
  const grouped = useMemo(() => {
    const map = new Map()
    notifications.forEach(n => {
      const key = `${n.subject}__${n.createdAt?.toMillis?.() || n.createdAt || 'x'}`
      if (!map.has(key)) map.set(key, { ...n, recipients: [] })
      map.get(key).recipients.push(n)
    })
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0
      const tb = b.createdAt?.toMillis?.() || 0
      return tb - ta
    })
  }, [notifications])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Send Notifications</h1>
          <p className="text-sm text-slate-400">{notifications.length} delivered · {grouped.length} broadcasts</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Send Notification</button>
      </div>
      {loading && <TableSkeleton />}

      <div className="space-y-3">
        {grouped.map(g => (
          <div key={g.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-white font-bold">{g.subject}</span>
                  <span className="badge badge-navy text-xs">{g.recipients.length} recipient{g.recipients.length > 1 ? 's' : ''}</span>
                  {g.audience && <span className="badge badge-green text-xs">{g.audience}</span>}
                </div>
                <p className="text-sm text-slate-300 mb-2">{g.message}</p>
                <div className="text-xs text-slate-500 truncate">
                  To: {g.recipients.slice(0, 3).map(r => r.studentName).join(', ')}
                  {g.recipients.length > 3 && ` +${g.recipients.length - 3} more`}
                </div>
              </div>
              <button onClick={() => g.recipients.forEach(r => remove(r.id))}
                className="text-sm text-red-400 cursor-pointer shrink-0 ml-2">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title="Send Notification" size="lg">
        <div className="space-y-4">
          {/* Audience picker */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Send to</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => setAudience('specific')}
                className={`py-2 rounded text-sm font-medium ${audience === 'specific' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                👤 Specific Students
              </button>
              <button onClick={() => setAudience('class')}
                className={`py-2 rounded text-sm font-medium ${audience === 'class' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                🎓 Whole Class
              </button>
              <button onClick={() => setAudience('all')}
                className={`py-2 rounded text-sm font-medium ${audience === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                📢 All ({students.length})
              </button>
            </div>

            {audience === 'class' && (
              <select className="input-field" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="">Pick class...</option>
                {classes.map(c => <option key={c}>{c}</option>)}
              </select>
            )}

            {audience === 'specific' && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder="Search by name, email, ID..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                  <button onClick={selectAllFiltered} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 rounded">
                    Select all shown
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-2 space-y-1">
                  {filteredStudents.slice(0, 100).map(s => {
                    const id = s.id || s.uid
                    const picked = selectedIds.has(id)
                    return (
                      <label key={id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${picked ? 'bg-green-brand/20' : 'hover:bg-white/5'}`}>
                        <input type="checkbox" checked={picked} onChange={() => toggleSelect(id)} className="accent-green-brand" />
                        <span className="text-white">{s.name}</span>
                        <span className="text-slate-500 text-xs ml-auto">{s.email || s.studentId}</span>
                      </label>
                    )
                  })}
                  {filteredStudents.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No students match</p>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedIds.size} selected</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label>
            <input className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Fee reminder, Performance update..." />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Message</label>
            <textarea className="input-field resize-none" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your message..." />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
            Will deliver to <b>{recipients.length}</b> student{recipients.length !== 1 ? 's' : ''}.
          </div>

          <button onClick={send} disabled={sending || recipients.length === 0} className="btn-primary w-full disabled:opacity-50">
            {sending ? 'Sending...' : `Send to ${recipients.length} student${recipients.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
