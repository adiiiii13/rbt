import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { updateDocument, deleteDocument, addDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ExportButton from '../../components/ExportButton'

// Writes notification doc with keys matching student-side query
// (studentUid + subject + message + link). Older fields kept for back-compat.
async function notifyStudent({ studentId, studentEmail, studentName, title, message, link = '' }) {
  if (!studentId && !studentEmail) return;
  try {
    await addDocument('notifications', {
      studentUid: studentId || '',
      studentName: studentName || '',
      studentEmail: studentEmail || '',
      subject: title,
      message,
      link,
      audience: 'counselling',
      read: false,
      createdAt: new Date(),
      // Back-compat fields (old schema)
      targetType: 'specific',
      targetStudentId: studentId || null,
      targetStudentEmail: studentEmail || null,
      title,
    });
  } catch (err) { console.error('[notify]', err); }
}

export default function ManageCounselling() {
  const { data: bookings, loading } = useRealtimeCollection('counsellingBookings')
  const [meetModal, setMeetModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [meetLink, setMeetLink] = useState('')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [editForm, setEditForm] = useState({ topic: '', studentName: '', parentName: '', phone: '', preferredDate: '', preferredTime: '', status: 'pending', meetingLink: '' })

  const approve = async () => {
    if (!meetLink || !selected) { toast.error('Add meet link'); return }
    try {
      await updateDocument('counsellingBookings', selected.id, {
        status: 'approved',
        meetingLink: meetLink,
        rejectionReason: '', // clear if previously rejected
      })
      await notifyStudent({
        studentId: selected.studentUid || selected.studentId,
        studentEmail: selected.email,
        studentName: selected.studentName,
        title: 'Counselling Session Approved',
        message: `Your session "${selected.topic}" on ${selected.preferredDate} ${selected.preferredTime || ''} is confirmed. Join: ${meetLink}`,
        link: meetLink,
      })
      toast.success('Approved + student notified')
      setMeetModal(false); setMeetLink(''); setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const openReject = (b) => { setSelected(b); setRejectReason(''); setRejectModal(true) }
  const reject = async () => {
    if (!selected) return
    try {
      await updateDocument('counsellingBookings', selected.id, {
        status: 'rejected',
        rejectionReason: rejectReason || 'No reason given',
        meetingLink: '', // clear any prior link
      })
      await notifyStudent({
        studentId: selected.studentUid || selected.studentId,
        studentEmail: selected.email,
        studentName: selected.studentName,
        title: 'Counselling Session Update',
        message: `Your session "${selected.topic}" could not be confirmed. Reason: ${rejectReason || 'Schedule conflict'}. Book another slot.`,
      })
      toast.success('Rejected + student notified')
      setRejectModal(false); setRejectReason(''); setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const reopen = async (id) => {
    if (!confirm('Re-open this rejected booking to pending?')) return
    try { await updateDocument('counsellingBookings', id, { status: 'pending', rejectionReason: '' }); toast.success('Re-opened') }
    catch (err) { toast.error(err.message) }
  }

  const complete = async (id) => {
    try { await updateDocument('counsellingBookings', id, { status: 'completed' }); toast.success('Marked completed') }
    catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this booking permanently?')) return
    try { await deleteDocument('counsellingBookings', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (b) => {
    setSelected(b)
    setEditForm({
      topic: b.topic || '',
      studentName: b.studentName || '',
      parentName: b.parentName || '',
      phone: b.phone || '',
      preferredDate: b.preferredDate || '',
      preferredTime: b.preferredTime || '',
      status: b.status || 'pending',
      meetingLink: b.meetingLink || '',
    })
    setEditModal(true)
  }

  const saveEdit = async () => {
    if (!selected) return
    try {
      await updateDocument('counsellingBookings', selected.id, editForm)
      toast.success('Updated')
      setEditModal(false); setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const statusColors = { pending: 'badge-gold', approved: 'badge-green', completed: 'badge-navy', rejected: 'badge-red' }
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Counselling Bookings</h1><p className="text-sm text-slate-400">{bookings.length} total</p></div>
        <ExportButton data={bookings} filename="counselling_bookings" columns={[
          { key: 'studentName', label: 'Student' },
          { key: 'parentName', label: 'Guardian' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'topic', label: 'Topic' },
          { key: 'preferredDate', label: 'Date' },
          { key: 'preferredTime', label: 'Time' },
          { key: 'studentType', label: 'Type' },
          { key: 'status', label: 'Status' },
          { key: 'meetingLink', label: 'Meet Link' },
          { key: 'rejectionReason', label: 'Rejection Reason' },
        ]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Pending</p><p className="text-xl font-bold text-amber-500">{pendingCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Approved</p><p className="text-xl font-bold text-green-brand">{bookings.filter(b => b.status === 'approved').length}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Total</p><p className="text-xl font-bold text-white">{bookings.length}</p></div>
      </div>
      {loading ? <TableSkeleton /> : bookings.length === 0 ? <p className="text-slate-500 text-center py-8">No bookings yet.</p> : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th className="text-white">Topic</th><th className="text-white">Student</th><th className="text-white">Guardian</th><th className="text-white">Type</th><th className="text-white">Date / Time</th><th className="text-white">Contact</th><th className="text-white">Status</th><th className="text-white">Meet</th><th className="text-white">Actions</th></tr></thead>
              <tbody>{bookings.map(b => (
                <tr key={b.id}>
                  <td className="text-white font-medium text-sm">{b.topic}</td>
                  <td className="text-slate-300 text-sm">{b.studentName}</td>
                  <td className="text-slate-300 text-sm">{b.parentName || <span className="text-slate-600 italic text-xs">—</span>}</td>
                  <td><span className={`badge text-xs ${b.studentType === 'Batch Student' ? 'badge-green' : 'badge-navy'}`}>{b.studentType || 'Unknown'}</span></td>
                  <td className="text-slate-400 text-sm">{b.preferredDate}<br/>{b.preferredTime}</td>
                  <td className="text-slate-400 text-sm">{b.phone}{b.email ? <><br/>{b.email}</> : ''}</td>
                  <td><span className={`badge ${statusColors[b.status]}`}>{b.status}</span></td>
                  <td>{b.meetingLink ? <a href={b.meetingLink} target="_blank" rel="noopener" className="text-sm text-blue-400 no-underline">Link</a> : '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      {b.status === 'pending' && <>
                        <button onClick={() => { setSelected(b); setMeetLink(''); setMeetModal(true) }} className="text-xs text-green-brand font-bold cursor-pointer">Approve</button>
                        <button onClick={() => openReject(b)} className="text-xs text-red-400 cursor-pointer">Reject</button>
                      </>}
                      {b.status === 'approved' && <button onClick={() => complete(b.id)} className="text-xs text-green-brand font-bold cursor-pointer">Complete</button>}
                      {b.status === 'rejected' && <button onClick={() => reopen(b.id)} className="text-xs text-blue-400 cursor-pointer">Re-open</button>}
                      <button onClick={() => openEdit(b)} className="text-xs text-blue-400 cursor-pointer">Edit</button>
                      <button onClick={() => remove(b.id)} className="text-xs text-red-400 cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={meetModal} onClose={() => setMeetModal(false)} title="Approve + Send Meet Link">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Meet link for <span className="text-white font-semibold">{selected?.studentName}</span>'s session on {selected?.preferredDate}.</p>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Google Meet Link</label><input className="input-field" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={meetLink} onChange={e => setMeetLink(e.target.value)} /><p className="text-xs text-slate-500 mt-1">Create at <a href="https://meet.new" target="_blank" className="text-green-brand">meet.new</a></p></div>
          <button onClick={approve} className="btn-primary w-full">Approve & Send Link</button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Booking — Send Reason">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Rejecting <span className="text-white font-semibold">{selected?.studentName}</span>'s session.</p>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Reason (sent to student)</label>
            <textarea rows={3} className="input-field resize-none" placeholder="e.g. Schedule conflict — please pick a different slot"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRejectModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={reject} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-2 rounded-lg">Reject & Notify</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Booking">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Topic</label><input className="input-field" value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Student Name</label><input className="input-field" value={editForm.studentName} onChange={e => setEditForm({...editForm, studentName: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Guardian Name</label><input className="input-field" value={editForm.parentName} onChange={e => setEditForm({...editForm, parentName: e.target.value})} placeholder="Parent / guardian" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Phone</label><input className="input-field" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Status</label><select className="input-field" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Date</label><input type="date" className="input-field" value={editForm.preferredDate} onChange={e => setEditForm({...editForm, preferredDate: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Time</label><input type="time" className="input-field" value={editForm.preferredTime} onChange={e => setEditForm({...editForm, preferredTime: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Meet Link</label><input className="input-field" placeholder="https://meet.google.com/..." value={editForm.meetingLink} onChange={e => setEditForm({...editForm, meetingLink: e.target.value})} /></div>
          <button onClick={saveEdit} className="btn-primary w-full">Save Changes</button>
        </div>
      </Modal>
    </div>
  )
}
