import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/contentApi'
import { updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageCounselling() {
  const { data: bookings, loading } = useRealtimeCollection('counsellingBookings', 'createdAt', [])
  const [meetModal, setMeetModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [meetLink, setMeetLink] = useState('')
  const [editForm, setEditForm] = useState({ topic: '', studentName: '', phone: '', preferredDate: '', preferredTime: '', status: 'pending', meetingLink: '' })

  const approve = async () => {
    if (!meetLink || !selected) { toast.error('Add meet link'); return }
    try {
      await updateDocument('counsellingBookings', selected.id, { status: 'approved', meetingLink: meetLink })
      toast.success('Approved + Meet link sent')
      setMeetModal(false); setMeetLink(''); setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const reject = async (id) => {
    if (!confirm('Reject this booking?')) return
    try { await updateDocument('counsellingBookings', id, { status: 'rejected' }); toast.success('Rejected') }
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
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Pending</p><p className="text-xl font-bold text-amber-500">{pendingCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Approved</p><p className="text-xl font-bold text-green-brand">{bookings.filter(b => b.status === 'approved').length}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Total</p><p className="text-xl font-bold text-white">{bookings.length}</p></div>
      </div>
      {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : bookings.length === 0 ? <p className="text-slate-500 text-center py-8">No bookings yet.</p> : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead><tr><th className="text-white">Topic</th><th className="text-white">Student</th><th className="text-white">Date / Time</th><th className="text-white">Contact</th><th className="text-white">Status</th><th className="text-white">Meet</th><th className="text-white">Actions</th></tr></thead>
              <tbody>{bookings.map(b => (
                <tr key={b.id}>
                  <td className="text-white font-medium text-sm">{b.topic}</td>
                  <td className="text-slate-300 text-sm">{b.studentName}{b.parentName ? ` & ${b.parentName}` : ''}</td>
                  <td className="text-slate-400 text-sm">{b.preferredDate}<br/>{b.preferredTime}</td>
                  <td className="text-slate-400 text-sm">{b.phone}{b.email ? <><br/>{b.email}</> : ''}</td>
                  <td><span className={`badge ${statusColors[b.status]}`}>{b.status}</span></td>
                  <td>{b.meetingLink ? <a href={b.meetingLink} target="_blank" rel="noopener" className="text-sm text-blue-400 no-underline">Link</a> : '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      {b.status === 'pending' && <>
                        <button onClick={() => { setSelected(b); setMeetLink(''); setMeetModal(true) }} className="text-xs text-green-brand font-bold cursor-pointer">Approve</button>
                        <button onClick={() => reject(b.id)} className="text-xs text-red-400 cursor-pointer">Reject</button>
                      </>}
                      {b.status === 'approved' && <button onClick={() => complete(b.id)} className="text-xs text-green-brand font-bold cursor-pointer">Complete</button>}
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

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Booking">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Topic</label><input className="input-field" value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Student Name</label><input className="input-field" value={editForm.studentName} onChange={e => setEditForm({...editForm, studentName: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Phone</label><input className="input-field" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Status</label><select className="input-field" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
