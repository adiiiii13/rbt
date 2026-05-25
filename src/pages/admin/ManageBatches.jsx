import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import { TableSkeleton } from '../../components/ui/Skeleton'
import ExportButton from '../../components/ExportButton'

const emptyBatch = {
  name: '',
  location: '',
  schedule: '',
  classId: '',
  maxStudents: 30,
  description: '',
  type: 'offline',
}

const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper']

export default function ManageBatches() {
  const { user: adminUser } = useAuth()
  const { data: batches, loading } = useRealtimeCollection('batches', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const { data: contacts } = useRealtimeCollection('inquiries', { fallback: [] })
  const { data: counsellingBookings } = useRealtimeCollection('counsellingBookings', { fallback: [] })

  const [tab, setTab] = useState('batches') // batches | students | contacts
  const [batchModal, setBatchModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyBatch)
  const [assignModal, setAssignModal] = useState(null) // batch to assign student to
  const [selectedStudent, setSelectedStudent] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)

  // Show all batches (online and offline)
  const displayBatches = useMemo(() =>
    batches,
    [batches]
  )

  // Get students assigned to batches
  const offlineStudentIds = useMemo(() => {
    const ids = new Set()
    students.forEach(s => {
      if (s.assignedBatchId && displayBatches.some(b => b.id === s.assignedBatchId)) {
        ids.add(s.id)
      }
    })
    return ids
  }, [students, displayBatches])

  const offlineStudents = useMemo(() =>
    students.filter(s => offlineStudentIds.has(s.id)),
    [students, offlineStudentIds]
  )

  // Approved contacts (from inquiries + counselling)
  const approvedContacts = useMemo(() => {
    const approved = []
    contacts.forEach(c => {
      if (c.status === 'approved' || c.offlineApproved) {
        approved.push({ ...c, source: 'inquiry', _type: 'contact' })
      }
    })
    counsellingBookings.forEach(c => {
      if (c.status === 'approved' || c.offlineApproved) {
        approved.push({ ...c, source: 'counselling', _type: 'counselling' })
      }
    })
    return approved
  }, [contacts, counsellingBookings])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyBatch)
    setBatchModal(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      name: b.name || '',
      location: b.location || '',
      schedule: b.schedule || '',
      classId: b.classId || '',
      maxStudents: b.maxStudents || 30,
      description: b.description || '',
      type: b.type || 'offline',
    })
    setBatchModal(true)
  }

  const saveBatch = async () => {
    if (!form.name.trim()) return toast.error('Batch name required')
    try {
      const payload = {
        ...form,
        type: form.type || 'offline',
        isOffline: form.type === 'offline',
        maxStudents: Number(form.maxStudents) || 30,
      }
      if (editing) {
        await updateDocument('batches', editing.id, payload)
        toast.success('Batch updated')
      } else {
        await addDocument('batches', { ...payload, currentStudents: 0, createdAt: new Date().toISOString() })
        toast.success('Batch created')
      }
      setBatchModal(false)
      setEditing(null)
      setForm(emptyBatch)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const removeBatch = async (id) => {
    if (!confirm('Delete this batch? Students will not be removed from their accounts.')) return
    try {
      await deleteDocument('batches', id)
      toast.success('Batch deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openAssign = (batch) => {
    setAssignModal(batch)
    setSelectedStudent('')
  }

  const confirmAssign = async () => {
    if (!selectedStudent) return toast.error('Select a student')
    if (!assignModal) return
    setAssignBusy(true)
    try {
      const student = students.find(s => s.id === selectedStudent)
      if (!student) return toast.error('Student not found')

      await updateDocument('students', selectedStudent, {
        batch: true,
        batchStatus: 'approved',
        assignedBatchId: assignModal.id,
        assignedBatchCode: assignModal.batchCode || '',
        assignedBatchName: assignModal.name || '',
        hasPaidBatchFee: true,
        batchPaymentMode: 'offline-manual',
        batchAssignedBy: adminUser?.uid || '',
        batchAssignedAt: new Date().toISOString(),
      })

      // Update batch student count
      const currentCount = assignModal.currentStudents || 0
      await updateDocument('batches', assignModal.id, {
        currentStudents: currentCount + 1,
      })

      toast.success(`${student.name} assigned to ${assignModal.name}`)
      setAssignModal(null)
      setSelectedStudent('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAssignBusy(false)
    }
  }

  const approveContact = async (contact) => {
    try {
      const collection = contact._type === 'counselling' ? 'counsellingBookings' : 'inquiries'
      await updateDocument(collection, contact.id, {
        offlineApproved: true,
        status: 'approved',
        approvedAt: new Date().toISOString(),
      })
      toast.success(`${contact.studentName || contact.name} approved for offline batch`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const removeStudentFromBatch = async (student) => {
    if (!confirm(`Remove ${student.name} from their batch?`)) return
    try {
      await updateDocument('students', student.id, {
        batch: false,
        batchStatus: 'none',
        assignedBatchId: null,
        assignedBatchCode: null,
        assignedBatchName: null,
      })
      toast.success(`${student.name} removed from batch`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="p-8"><TableSkeleton /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch/Class</h1>
          <p className="text-sm text-slate-400">Manage online/offline batches and assign students manually</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={offlineStudents}
            filename="offline_batch_students"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'class', label: 'Class' },
              { key: 'assignedBatchName', label: 'Batch' },
              { key: 'batchStatus', label: 'Status' },
            ]}
          />
          <button onClick={openCreate} className="px-4 py-2 bg-green-brand text-white rounded-lg text-sm font-bold hover:bg-green-600">
            + Create Batch
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'batches', label: 'Batches', count: displayBatches.length },
          { id: 'students', label: 'Students', count: offlineStudents.length },
          { id: 'contacts', label: 'Contact Approvals', count: approvedContacts.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t.id ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Batches Tab */}
      {tab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayBatches.length === 0 ? (
            <div className="col-span-full bg-[#111111] rounded-2xl border border-slate-800 p-12 text-center">
              <p className="text-slate-500 mb-3">No batches yet.</p>
              <button onClick={openCreate} className="text-green-brand font-bold text-sm hover:underline">Create first batch →</button>
            </div>
          ) : displayBatches.map(b => (
            <div key={b.id} className="bg-[#111111] rounded-2xl border border-slate-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold">{b.name}</h3>
                  {b.classId && <span className="text-xs text-slate-500">{b.classId}</span>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${b.type === 'online' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {b.type === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              {b.location && <p className="text-sm text-slate-400 mb-1">📍 {b.location}</p>}
              {b.schedule && <p className="text-sm text-slate-400 mb-1">🕐 {b.schedule}</p>}
              {b.description && <p className="text-xs text-slate-500 mb-3">{b.description}</p>}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>{b.currentStudents || 0} / {b.maxStudents || 30} students</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openAssign(b)} className="flex-1 bg-green-brand/10 hover:bg-green-brand/20 text-green-brand text-sm py-2 rounded font-bold">
                  + Add Student
                </button>
                <button onClick={() => openEdit(b)} className="bg-white/10 hover:bg-white/20 text-white text-sm py-2 px-3 rounded">Edit</button>
                <button onClick={() => removeBatch(b.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm py-2 px-3 rounded">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          {offlineStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No students assigned to offline batches yet.</div>
          ) : (
            <div className="table-container">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-slate-800">
                  <tr>
                    <th className="text-white font-bold">Student</th>
                    <th className="text-white font-bold">Phone</th>
                    <th className="text-white font-bold">Class</th>
                    <th className="text-white font-bold">Batch</th>
                    <th className="text-white font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {offlineStudents.map(s => {
                    const batch = displayBatches.find(b => b.id === s.assignedBatchId)
                    return (
                      <tr key={s.id} className="hover:bg-white/5">
                        <td>
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.email}</div>
                        </td>
                        <td className="text-slate-300">{s.phone || '-'}</td>
                        <td className="text-slate-300">{s.class || '-'}</td>
                        <td>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                            {batch?.name || s.assignedBatchName || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => removeStudentFromBatch(s)} className="text-sm font-bold text-red-400 hover:text-red-300">
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {tab === 'contacts' && (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          {approvedContacts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No approved contacts yet. Approve contacts from Inquiries or Counselling to add them here.</div>
          ) : (
            <div className="table-container">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-slate-800">
                  <tr>
                    <th className="text-white font-bold">Name</th>
                    <th className="text-white font-bold">Phone</th>
                    <th className="text-white font-bold">Source</th>
                    <th className="text-white font-bold">Status</th>
                    <th className="text-white font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {approvedContacts.map(c => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td>
                        <div className="font-semibold text-white">{c.studentName || c.name}</div>
                        <div className="text-xs text-slate-500">{c.studentEmail || c.email}</div>
                      </td>
                      <td className="text-slate-300">{c.phone || '-'}</td>
                      <td>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 capitalize">{c.source}</span>
                      </td>
                      <td>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400">Approved</span>
                      </td>
                      <td>
                        {displayBatches.length > 0 ? (
                          <button onClick={() => {
                            // Open assign modal with pre-selected contact
                            setAssignModal(displayBatches[0])
                            setSelectedStudent('')
                            // TODO: auto-create student from contact if not exists
                          }} className="text-sm font-bold text-green-400 hover:text-green-300">
                            Assign to Batch
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Create batch first</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Batch Modal */}
      <Modal isOpen={batchModal} onClose={() => { setBatchModal(false); setEditing(null) }} title={editing ? 'Edit Batch' : 'Create Batch/Class'}>
        <div className="space-y-4 p-1">
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch Name *</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. Morning Batch - Class 10"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch Type</label>
            <select
              className="input-field w-full"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Class</label>
              <select
                className="input-field w-full"
                value={form.classId}
                onChange={e => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">-- Select --</option>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Max Students</label>
              <input
                type="number"
                className="input-field w-full"
                value={form.maxStudents}
                onChange={e => setForm({ ...form, maxStudents: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Location</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. RBT Coaching Center, Room 201"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Schedule</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. Mon-Sat, 8:00 AM - 10:00 AM"
              value={form.schedule}
              onChange={e => setForm({ ...form, schedule: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Description</label>
            <textarea
              className="input-field w-full"
              rows={2}
              placeholder="Optional description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button onClick={saveBatch} className="btn-primary w-full bg-green-500 hover:bg-green-600">
            {editing ? 'Update Batch' : 'Create Batch'}
          </button>
        </div>
      </Modal>

      {/* Assign Student Modal */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Add Student to ${assignModal?.name || 'Batch'}`}>
        {assignModal && (
          <div className="space-y-4 p-1">
            <p className="text-sm text-slate-300">Select a student to assign to <strong className="text-white">{assignModal.name}</strong>.</p>
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Student</label>
              <select
                className="input-field w-full"
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentId || s.email})</option>
                ))}
              </select>
            </div>
            <button
              onClick={confirmAssign}
              disabled={assignBusy}
              className="btn-primary w-full bg-green-500 hover:bg-green-600 disabled:opacity-50"
            >
              {assignBusy ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
