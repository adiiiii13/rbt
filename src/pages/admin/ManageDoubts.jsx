import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import ExportButton from '../../components/ExportButton'

export default function ManageDoubts() {
  const { data: doubts, loading } = useRealtimeCollection('doubts', { fallback: [] })
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')

  const pendingCount = doubts.filter(d => d.status === 'pending').length

  const answer = async () => {
    if (!reply.trim() || !selected) { toast.error('Write a reply'); return }
    try {
      await updateDocument('doubts', selected.id, { status: 'answered', adminReply: reply })
      toast.success('Reply sent')
      setReply('')
      setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this doubt permanently?')) return;
    try {
      await deleteDocument('doubts', id);
      toast.success('Doubt deleted');
    } catch (err) { toast.error(err.message) }
  }

  const statusColors = { pending: 'badge-gold', answered: 'badge-green' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Doubts</h1><p className="text-sm text-slate-400">{doubts.length} total, {pendingCount} pending</p></div>
        <ExportButton data={doubts} filename="doubts" columns={[
          { key: 'studentName', label: 'Student' },
          { key: 'studentEmail', label: 'Email' },
          { key: 'studentType', label: 'Type' },
          { key: 'subject', label: 'Subject' },
          { key: 'text', label: 'Question' },
          { key: 'status', label: 'Status' },
          { key: 'adminReply', label: 'Admin Reply' },
          { key: 'imageUrl', label: 'Image URL' },
        ]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Pending</p><p className="text-xl font-bold text-amber-500">{pendingCount}</p></div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800"><p className="text-xs text-slate-400 mb-1">Total</p><p className="text-xl font-bold text-white">{doubts.length}</p></div>
      </div>
      {loading ? <TableSkeleton /> : doubts.length === 0 ? <p className="text-slate-500 text-center py-8">No doubts yet.</p> : (
        <div className="space-y-4">
          {doubts.map(d => (
            <div key={d.id} className={`bg-[#111111] rounded-2xl p-5 border ${d.status === 'pending' ? 'border-amber-500/20' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{d.studentName}</span>
                  <span className={`badge text-xs ${d.studentType === 'Batch Student' ? 'badge-green' : 'badge-navy'}`}>{d.studentType || 'Unknown'}</span>
                  {d.subject && <span className="badge badge-navy text-xs">{d.subject}</span>}
                  <span className={`badge ${statusColors[d.status]}`}>{d.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  {d.status === 'pending' && (
                    <button onClick={() => { setSelected(d); setReply('') }} className="text-sm text-green-brand font-bold cursor-pointer">Reply</button>
                  )}
                  <button onClick={() => remove(d.id)} className="text-sm text-red-500 font-bold cursor-pointer">Delete</button>
                </div>
              </div>
              {d.text && <p className="text-sm text-slate-300 mb-2">{d.text}</p>}
              {d.imageUrl && (
                <a href={d.imageUrl} target="_blank" rel="noopener" className="inline-block mb-2">
                  <img src={d.imageUrl} alt="Doubt" className="w-full max-h-40 object-contain rounded-lg border border-slate-700" loading="lazy" />
                </a>
              )}
              {d.adminReply && (
                <div className="mt-2 p-3 rounded-xl bg-green-brand/5 border border-green-brand/20">
                  <p className="text-xs font-bold text-green-brand uppercase mb-1">Your Reply</p>
                  <p className="text-sm text-slate-300">{d.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setReply('') }} title="Reply to Doubt">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Student</p>
              <p className="text-white font-semibold">{selected.studentName}</p>
            </div>
            {selected.text && <div><p className="text-xs text-slate-500 uppercase mb-1">Question</p><p className="text-slate-300">{selected.text}</p></div>}
            {selected.imageUrl && <img src={selected.imageUrl} alt="Doubt" className="w-full max-h-48 object-contain rounded-lg border border-slate-700" />}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Your Reply</label>
              <textarea className="input-field resize-none" rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Write your answer..." />
            </div>
            <button onClick={answer} className="btn-primary w-full">Send Reply</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
