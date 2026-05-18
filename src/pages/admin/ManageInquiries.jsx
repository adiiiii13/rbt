import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/contentApi'
import { updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageInquiries() {
  const { data: inquiries, loading } = useRealtimeCollection('inquiries', 'createdAt', [])
  const [selected, setSelected] = useState(null)

  const markRead = async (id) => {
    try { await updateDocument('inquiries', id, { read: true }); toast.success('Marked read') }
    catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this inquiry?')) return
    try { await deleteDocument('inquiries', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const unreadCount = inquiries.filter(i => !i.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Contact Inquiries</h1><p className="text-sm text-slate-400">{inquiries.length} total, {unreadCount} unread</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Unread</p><p className="text-xl font-bold text-amber-500">{unreadCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Total</p><p className="text-xl font-bold text-white">{inquiries.length}</p></div>
      </div>
      {loading ? <p className="text-slate-400 text-center py-8">Loading...</p> : inquiries.length === 0 ? <p className="text-slate-500 text-center py-8">No inquiries yet.</p> : (
        <div className="space-y-4">
          {inquiries.map(i => (
            <div key={i.id} className={`bg-[#111111] rounded-2xl p-5 border ${i.read ? 'border-slate-800' : 'border-amber-500/30'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!i.read && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                  <h3 className="font-bold text-white">{i.name}</h3>
                </div>
                <div className="flex gap-2">
                  {!i.read && <button onClick={() => markRead(i.id)} className="text-xs text-amber-400 cursor-pointer">Mark Read</button>}
                  <button onClick={() => setSelected(i)} className="text-xs text-blue-400 cursor-pointer">View</button>
                  <button onClick={() => remove(i.id)} className="text-xs text-red-400 cursor-pointer">Delete</button>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-1">{i.email}{i.phone ? ` • ${i.phone}` : ''}</p>
              <p className="text-sm text-slate-400 line-clamp-2">{i.message}</p>
              {i.date && <p className="text-xs text-slate-500 mt-2">{i.date}</p>}
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Inquiry Details">
        {selected && (
          <div className="space-y-3">
            <div><p className="text-xs text-slate-500 uppercase">Name</p><p className="text-white font-semibold">{selected.name}</p></div>
            <div><p className="text-xs text-slate-500 uppercase">Email</p><p className="text-white">{selected.email}</p></div>
            {selected.phone && <div><p className="text-xs text-slate-500 uppercase">Phone</p><p className="text-white">{selected.phone}</p></div>}
            <div><p className="text-xs text-slate-500 uppercase">Message</p><p className="text-slate-300 whitespace-pre-wrap">{selected.message}</p></div>
            {selected.date && <div><p className="text-xs text-slate-500 uppercase">Date</p><p className="text-slate-400">{selected.date}</p></div>}
            <div className="flex gap-3 pt-2">
              {!selected.read && <button onClick={() => { markRead(selected.id); setSelected(null) }} className="btn-primary text-sm flex-1">Mark Read</button>}
              <a href={`mailto:${selected.email}`} className="btn-primary text-sm flex-1 text-center no-underline">Reply Email</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
