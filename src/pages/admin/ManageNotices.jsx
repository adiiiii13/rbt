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
  { id: 'all', label: '📢 All Students', desc: 'Every student sees this' },
  { id: 'class', label: '🎓 Specific Class', desc: 'Only students from one class' },
  { id: 'batch', label: '📚 Specific Batch', desc: 'Only students from one batch' },
  { id: 'specific', label: '👤 Specific Students', desc: 'Hand-picked recipients' },
]

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const BATCHES = ['Morning Batch', 'Evening Batch', 'Weekend Batch', 'Online Batch', 'Crash Course', 'Dropper Batch']

const emptyForm = {
  title: '', content: '', priority: 'medium', category: 'General',
  audience: 'all', targetClass: '', targetBatch: '', targetStudentIds: [],
}

export default function ManageNotices() {
  const { data: noticesRaw, loading } = useRealtimeCollection('notices', { fallback: defaultNotices })
  const notices = noticesRaw?.length ? noticesRaw : defaultNotices
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q))
  }, [students, search])

  const targetStudents = useMemo(() => {
    if (form.audience === 'all') return students
    if (form.audience === 'class') return students.filter(s => s.className === form.targetClass)
    if (form.audience === 'batch') return students.filter(s => s.batch === form.targetBatch)
    if (form.audience === 'specific') return students.filter(s => form.targetStudentIds.includes(s.id || s.uid))
    return []
  }, [form.audience, form.targetClass, form.targetBatch, form.targetStudentIds, students])

  const save = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    try {
      if (editing) {
        await updateDocument('notices', editing.id, form)
        toast.success('Updated')
      } else {
        await addDocument('notices', { ...form, date: new Date().toISOString().split('T')[0], createdAt: new Date() })
        toast.success('Published')

        // Send notification to targeted students
        if (form.audience !== 'all') {
          await Promise.all(targetStudents.slice(0, 100).map(s => addDocument('notifications', {
            studentUid: s.id || s.uid,
            studentName: s.name || '',
            subject: `Notice: ${form.title}`,
            message: form.content,
            audience: form.audience,
            read: false,
            createdAt: new Date(),
          })))
          toast.success(`Sent to ${Math.min(targetStudents.length, 100)} student(s)`)
        }
      }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteItemSmart('notices', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (n) => { setEditing(n); setForm({ title: n.title, content: n.content, priority: n.priority, category: n.category, audience: n.audience || 'all', targetClass: n.targetClass || '', targetBatch: n.targetBatch || '', targetStudentIds: n.targetStudentIds || [] }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setSearch(''); setDropdownOpen(false) }

  const toggleStudent = (id) => {
    setForm(f => {
      const ids = f.targetStudentIds.includes(id) ? f.targetStudentIds.filter(x => x !== id) : [...f.targetStudentIds, id]
      return { ...f, targetStudentIds: ids }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Notices</h1><p className="text-sm text-slate-400">{notices.length} notices</p></div>
        <div className="flex gap-2">
          <ExportButton data={notices} filename="notices" columns={[
            { key: 'title', label: 'Title' },
            { key: 'content', label: 'Content' },
            { key: 'priority', label: 'Priority' },
            { key: 'category', label: 'Category' },
            { key: 'audience', label: 'Audience' },
            { key: 'targetClass', label: 'Target Class' },
            { key: 'targetBatch', label: 'Target Batch' },
            { key: 'date', label: 'Date' },
          ]} />
          <button onClick={() => setModal(true)} className="btn-primary">+ Add Notice</button>
        </div>
      </div>
      {loading && <TableSkeleton />}

      <div className="space-y-4">
        {notices.map(n => (
          <div key={n.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                <h3 className="font-bold text-white">{n.title}</h3>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(n)} className="text-sm text-blue-400 cursor-pointer">Edit</button>
                <button onClick={() => remove(n.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-2">{n.content}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{n.date}</span>
              <span className="badge badge-navy">{n.category}</span>
              <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-gold' : 'badge-green'}`}>{n.priority}</span>
              {n.audience && n.audience !== 'all' && <span className="badge badge-navy">{n.audience}: {n.targetClass || n.targetBatch || `${n.targetStudentIds?.length || 0} students`}</span>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Notice' : 'Add Notice'} size="lg">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Content</label><textarea className="input-field resize-none" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Priority</label><select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Category</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{['General','Academic','Exam','Holiday','Event','Fee'].map(c => <option key={c}>{c}</option>)}</select></div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Send To</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCES.map(a => (
                <button key={a.id} onClick={() => setForm({...form, audience: a.id, targetClass: '', targetBatch: '', targetStudentIds: [] })}
                  className={`p-3 rounded-xl text-left cursor-pointer transition-all ${form.audience === a.id ? 'bg-green-brand/15 border-2 border-green-brand' : 'bg-white/5 border-2 border-transparent'}`}>
                  <p className="text-white text-sm font-bold">{a.label}</p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.audience === 'class' && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Select Class</label>
              <select className="input-field" value={form.targetClass} onChange={e => setForm({...form, targetClass: e.target.value})}>
                <option value="">Pick class...</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              {form.targetClass && <p className="text-xs text-green-brand mt-1">{targetStudents.length} student(s) in {form.targetClass}</p>}
            </div>
          )}

          {form.audience === 'batch' && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Select Batch</label>
              <select className="input-field" value={form.targetBatch} onChange={e => setForm({...form, targetBatch: e.target.value})}>
                <option value="">Pick batch...</option>
                {BATCHES.map(b => <option key={b}>{b}</option>)}
              </select>
              {form.targetBatch && <p className="text-xs text-green-brand mt-1">{targetStudents.length} student(s) in {form.targetBatch}</p>}
            </div>
          )}

          {form.audience === 'specific' && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Search & Select Students</label>
              <input className="input-field mb-2" placeholder="Search by name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setDropdownOpen(true)} />
              {dropdownOpen && filteredStudents.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-[#111111] border border-slate-700 rounded-xl">
                  {filteredStudents.slice(0, 15).map(s => (
                    <button key={s.id || s.uid} onClick={() => toggleStudent(s.id || s.uid)}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm cursor-pointer ${form.targetStudentIds.includes(s.id || s.uid) ? 'bg-green-brand/10 text-green-brand' : 'hover:bg-white/5 text-white'}`}>
                      <span>{s.name} <span className="text-xs text-slate-500">{s.email}</span></span>
                      {form.targetStudentIds.includes(s.id || s.uid) && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-green-brand mt-1">{form.targetStudentIds.length} student(s) selected</p>
            </div>
          )}

          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Publish'} Notice</button>
        </div>
      </Modal>
    </div>
  )
}
