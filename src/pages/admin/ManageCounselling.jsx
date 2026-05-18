import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/contentApi'
import { updateDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageCounselling() {
  const { data: bookings, loading } = useRealtimeCollection('counsellingBookings', 'createdAt', [])
  const [meetModal, setMeetModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [meetLink, setMeetLink] = useState('')

  const approve = async () => {
    if (!meetLink || !selectedBooking) { toast.error('Add meet link'); return }
    try {
      await updateDocument('counsellingBookings', selectedBooking.id, { status: 'approved', meetingLink: meetLink })
      toast.success('Approved')
      setMeetModal(false); setMeetLink(''); setSelectedBooking(null)
    } catch (err) { toast.error(err.message) }
  }

  const reject = async (id) => {
    if (!confirm('Reject?')) return
    try { await updateDocument('counsellingBookings', id, { status: 'rejected' }); toast.success('Rejected') }
    catch (err) { toast.error(err.message) }
  }

  const complete = async (id) => {
    try { await updateDocument('counsellingBookings', id, { status: 'completed' }); toast.success('Completed') }
    catch (err) { toast.error(err.message) }
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const approvedCount = bookings.filter(b => b.status === 'approved').length

  const statusColors = { pending: 'badge-gold', approved: 'badge-green', completed: 'badge-navy', rejected: 'badge-red' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Counselling Bookings</h1><p className="text-sm text-slate-400">{bookings.length} total</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Pending</p><p className="text-xl font-bold text-amber-500">{pendingCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Approved</p><p className="text-xl font-bold text-green-brand">{approvedCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Total</p><p className="text-xl font-bold text-white">{bookings.length}</p></div>
      </div>
      {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : bookings.length === 0 ? <p className="text-slate-500 text-center py-8">No bookings yet.</p> : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-bold text-white">{b.topic}</h3><p className="text-sm text-slate-400">{b.studentName} {b.parentName ? `& ${b.parentName}` : ''}</p></div>
                <span className={`badge ${statusColors[b.status]}`}>{b.status}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                <span>{b.preferredDate}</span><span>{b.preferredTime}</span><span>{b.phone}</span>{b.email && <span>{b.email}</span>}
              </div>
              <div className="flex gap-2">
                {b.status === 'pending' && (<><button onClick={() => { setSelectedBooking(b); setMeetLink(''); setMeetModal(true) }} className="text-sm text-green-brand font-bold cursor-pointer">Approve + Meet Link</button><button onClick={() => reject(b.id)} className="text-sm text-red-400 font-bold cursor-pointer">Reject</button></>)}
                {b.status === 'approved' && (<>{b.meetingLink && <a href={b.meetingLink} target="_blank" rel="noopener" className="text-sm text-blue-400 font-bold no-underline">Open Meet</a>}<button onClick={() => complete(b.id)} className="text-sm text-green-brand font-bold cursor-pointer">Mark Completed</button></>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={meetModal} onClose={() => setMeetModal(false)} title="Approve Booking">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Add Meet link for <span className="text-white font-semibold">{selectedBooking?.studentName}</span>'s session on {selectedBooking?.preferredDate}.</p>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Google Meet Link</label><input className="input-field" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={meetLink} onChange={e => setMeetLink(e.target.value)} /><p className="text-xs text-slate-500 mt-1">Create at <a href="https://meet.new" target="_blank" className="text-green-brand">meet.new</a> and paste here</p></div>
          <button onClick={approve} className="btn-primary w-full">Approve & Send Link</button>
        </div>
      </Modal>
    </div>
  )
}
