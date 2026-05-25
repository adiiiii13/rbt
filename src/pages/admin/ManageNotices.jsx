import { TableSkeleton } from '../../components/ui/Skeleton'
import { useState, useMemo } from 'react'
import { deleteItemSmart } from '../../lib/contentApi'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument } from '../../lib/firebaseHelpers'
import { defaultNotices } from '../../data/notices'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ExportButton from '../../components/ExportButton'

const AUDIENCES = [
  { id: 'all', label: '📢 All Students' },
  { id: 'class', label: '🎓 Whole Class' },
  { id: 'batch', label: '📚 Whole Batch' },
  { id: 'specific', label: '👤 Specific Students' },
]

const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper']

const emptyForm = {
  title: '', content: '', priority: 'medium', category: 'General',
  audience: 'all', targetClass: '', targetBatch: '', targetStudentIds: [],
}

export default function ManageNotices() {
  const { data: notices, loading } = useRealtimeCollection('notices', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const { data: batchesList } = useRealtimeCollection('batches', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.email || '').toLowerCase().includes(q) || 
      (s.studentId || '').toLowerCase().includes(q)
    )
  }, [students, search])

  const targetStudents = useMemo(() => {
    if (form.audience === 'all') return students
    if (form.audience === 'class') return students.filter(s => (s.class || s.className) === form.targetClass)
    if (form.audience === 'batch') return students.filter(s => s.batchId === form.targetBatch || s.assignedBatchId === form.targetBatch)
    if (form.audience === 'specific') return students.filter(s => form.targetStudentIds.includes(s.id || s.uid))
    return []
  }, [form.audience, form.targetBatch, form.targetClass, form.targetStudentIds, students])

  const save = async () => {
    if (!form.title || !form.content) { toast.error('Title and message required'); return }
    if (form.audience === 'class' && !form.targetClass) { toast.error('Select a class'); return }
    if (form.audience === 'batch' && !form.targetBatch) { toast.error('Select a batch'); return }
    if (form.audience === 'specific' && !form.targetStudentIds.length) { toast.error('Select students'); return }

    setBusy(true)
    try {
      if (editing) {
        await updateDocument('notices', editing.id, form)
        toast.success('Notice Updated')
      } else {
        const noticeRef = await addDocument('notices', { 
          ...form, 
          date: new Date().toISOString().split('T')[0], 
          createdAt: new Date() 
        })

        const recipients = targetStudents.slice(0, 500)
        if (recipients.length > 0) {
          await Promise.all(recipients.map(s => addDocument('notifications', {
            studentUid: s.id || s.uid,
            studentName: s.name || '',
            subject: `Notice: ${form.title}`,
            message: form.content,
            audience: form.audience,
            read: false,
            createdAt: new Date(),
            noticeId: noticeRef.id 
          })))
          toast.success(`Sent & Pushed to ${recipients.length} students`)
        } else {
          toast.success('Notice Published')
        }
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this notice?')) return
    try { await deleteItemSmart('notices', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (n) => { setEditing(n); setForm({ ...n }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setSearch('') }

  const toggleStudent = (id) => {
    setForm(f => {
      const ids = f.targetStudentIds.includes(id) ? f.targetStudentIds.filter(x => x !== id) : [...f.targetStudentIds, id]
      return { ...f, targetStudentIds: ids }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notices & Announcements</h1>
          <p className="text-sm text-slate-400">Send announcements directly to student dashboards</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={notices} filename="notices" columns={[{ key: 'title', label: 'Title' }, { key: 'date', label: 'Date' }, { key: 'audience', label: 'Sent To' }]} />
          <button onClick={() => setModal(true)} className="btn-primary">+ Create New Notice</button>
        </div>
      </div>

      {loading && <TableSkeleton />}

      <div className="grid gap-4">
        {notices.length === 0 && !loading && (
          <div className="bg-[#111111] rounded-2xl p-12 text-center border border-dashed border-slate-800">
            <p className="text-slate-500">No notices sent yet. Click "Create New Notice" to start.</p>
          </div>
        )}
        {notices.map(n => (
          <div key={n.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                  <h3 className="font-bold text-white text-lg">{n.title}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-3 whitespace-pre-wrap">{n.content}</p>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold">
                  <span className="text-slate-500">{n.date}</span>
                  <span className="badge badge-navy px-2 py-0.5">{n.category}</span>
                  <span className="text-green-brand">To: {n.audience === 'all' ? 'All Students' : n.targetClass || n.targetBatch || `${n.targetStudentIds?.length || 0} students`}</span>
                </div>
              </div>
              <div className="flex gap-4 ml-4">
                <button onClick={() => openEdit(n)} className="text-sm text-blue-400 font-bold hover:underline cursor-pointer">Edit</button>
                <button onClick={() => remove(n.id)} className="text-sm text-red-400 font-bold hover:underline cursor-pointer">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Update Notice' : 'Send New Notice'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Title</label>
            <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Holiday Announcement" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Message Content</label>
            <textarea className="input-field resize-none" rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write the full notice details here..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {['General','Academic','Exam','Holiday','Fee'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low (Gray)</option>
                <option value="medium">Medium (Amber)</option>
                <option value="high">High (Red)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <label className="text-sm font-bold text-slate-400 mb-3 block text-center">Who should receive this?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {AUDIENCES.map(a => (
                <button key={a.id} type="button" onClick={() => setForm({...form, audience: a.id, targetClass: '', targetBatch: '', targetStudentIds: [] })}
                  className={`p-3 rounded-xl text-center transition-all ${form.audience === a.id ? 'bg-green-brand/20 border-2 border-green-brand text-white' : 'bg-white/5 border-2 border-transparent text-slate-500 hover:text-slate-300'}`}>
                  <p className="text-[10px] font-bold uppercase">{a.label}</p>
                </button>
              ))}
            </div>

            {form.audience === 'class' && (
              <select className="input-field animate-in fade-in slide-in-from-top-2" value={form.targetClass} onChange={e => setForm({...form, targetClass: e.target.value})}>
                <option value="">-- Select Class --</option>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {form.audience === 'batch' && (
              <select className="input-field animate-in fade-in slide-in-from-top-2" value={form.targetBatch} onChange={e => setForm({...form, targetBatch: e.target.value})}>
                <option value="">-- Select Batch --</option>
                {batchesList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            {form.audience === 'specific' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <input className="input-field mb-2" placeholder="Search student name..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="max-h-40 overflow-y-auto bg-black/40 rounded-xl p-2 border border-white/5 space-y-1">
                  {filteredStudents.map(s => (
                    <label key={s.id || s.uid} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${form.targetStudentIds.includes(s.id || s.uid) ? 'bg-green-brand/10' : 'hover:bg-white/5'}`}>
                      <input type="checkbox" checked={form.targetStudentIds.includes(s.id || s.uid)} onChange={() => toggleStudent(s.id || s.uid)} className="accent-green-brand" />
                      <span className="text-sm text-white">{s.name}</span>
                      <span className="text-[10px] text-slate-500 ml-auto">{s.className || s.class}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-green-brand/5 border border-green-brand/20 rounded-xl p-4 text-center">
            <p className="text-xs text-green-brand font-bold">
              Target: {targetStudents.length} student(s) will receive a dashboard notice and a bell notification.
            </p>
          </div>

          <button onClick={save} disabled={busy} className="btn-primary w-full py-4 text-lg shadow-xl shadow-green-brand/20 disabled:opacity-50">
            {busy ? 'Processing...' : editing ? 'Update Notice' : '🚀 Publish & Send Notice'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
