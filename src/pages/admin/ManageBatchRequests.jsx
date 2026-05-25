import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { updateDocument } from '../../lib/firebaseHelpers'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import { TableSkeleton } from '../../components/ui/Skeleton'
import ExportButton from '../../components/ExportButton'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'called', label: 'Called' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const STATUS_STYLE = {
  pending: 'badge-amber',
  called: 'badge-blue',
  approved: 'badge-green',
  rejected: 'badge-red',
}

export default function ManageBatchRequests() {
  const { user: adminUser } = useAuth()
  const { data: requests, loading } = useRealtimeCollection('batchRequests', { orderField: 'createdAt', orderDir: 'desc' })
  const { data: batches } = useRealtimeCollection('batches')

  const [tab, setTab] = useState('all')
  const [viewModal, setViewModal] = useState(null) // request being viewed
  const [approveModal, setApproveModal] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)

  // Approve form state
  const [approveForm, setApproveForm] = useState({
    classId: '',
    batchId: '',
    paymentMode: 'offline-cash',
    markPaid: true,
    paymentNote: '',
  })
  const [rejectReason, setRejectReason] = useState('')

  const openApprove = (req) => {
    setApproveModal(req)
    setApproveForm({
      classId: req.class || '',
      batchId: req.preferredBatchId || '',
      paymentMode: 'offline-cash',
      markPaid: true,
      paymentNote: '',
    })
  }

  const markCalled = async (req) => {
    try {
      await updateDoc(doc(db, 'batchRequests', req.id), {
        status: 'called',
        calledAt: serverTimestamp(),
      })
      toast.success('Marked as called')
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const confirmApprove = async () => {
    if (!approveForm.batchId) return toast.error('Pick a batch to assign')
    const batch = batches.find((b) => b.id === approveForm.batchId)
    if (!batch) return toast.error('Batch not found')

    const req = approveModal
    try {
      // Update student doc — grant batch access
      await updateDocument('students', req.uid, {
        batch: true,
        batchStatus: 'approved',
        assignedBatchId: batch.id,
        assignedBatchCode: batch.batchCode || '',
        assignedBatchName: batch.name || batch.className || '',
        assignedClassId: approveForm.classId,
        hasPaidBatchFee: approveForm.markPaid,
        batchPaymentMode: approveForm.paymentMode,
        batchPaymentNote: approveForm.paymentNote,
      })

      // Update request doc
      await updateDoc(doc(db, 'batchRequests', req.id), {
        status: 'approved',
        reviewedBy: adminUser?.uid || '',
        reviewedAt: serverTimestamp(),
        assignedClassId: approveForm.classId,
        assignedBatchId: batch.id,
        assignedBatchName: batch.name || batch.className || '',
        paymentMode: approveForm.paymentMode,
        markPaid: approveForm.markPaid,
        paymentNote: approveForm.paymentNote,
      })

      toast.success('Approved + batch assigned')
      setApproveModal(null)
    } catch (err) {
      console.error(err)
      toast.error('Approval failed')
    }
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) return toast.error('Provide rejection reason')
    const req = rejectModal
    try {
      await updateDoc(doc(db, 'batchRequests', req.id), {
        status: 'rejected',
        adminNotes: rejectReason,
        reviewedBy: adminUser?.uid || '',
        reviewedAt: serverTimestamp(),
      })
      await updateDocument('students', req.uid, { batchStatus: 'none' })
      toast.success('Request rejected')
      setRejectModal(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Reject failed')
    }
  }

  if (loading) return <div className="p-8"><TableSkeleton /></div>

  const filtered = tab === 'all' ? requests : requests.filter((r) => r.status === tab)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch Upgrade Requests</h1>
          <p className="text-sm text-slate-400">Review applications for offline batch enrollment</p>
        </div>
        <ExportButton
          data={requests}
          filename="batch_requests"
          columns={[
            { key: 'studentName', label: 'Name' },
            { key: 'studentEmail', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'parentName', label: 'Parent' },
            { key: 'parentPhone', label: 'Parent Phone' },
            { key: 'class', label: 'Class' },
            { key: 'board', label: 'Board' },
            { key: 'school', label: 'School' },
            { key: 'preferredBatchTime', label: 'Time Pref' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Submitted' },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {t.label} {tab !== t.id && requests.filter((r) => t.id === 'all' || r.status === t.id).length > 0 && (
              <span className="ml-1 text-xs opacity-60">({requests.filter((r) => t.id === 'all' || r.status === t.id).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No requests in this tab.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-slate-800">
                <tr>
                  <th className="text-white font-bold">Name</th>
                  <th className="text-white font-bold">Phone</th>
                  <th className="text-white font-bold">Class</th>
                  <th className="text-white font-bold">Time</th>
                  <th className="text-white font-bold">Status</th>
                  <th className="text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td>
                      <div className="font-semibold text-white">{r.studentName}</div>
                      <div className="text-xs text-slate-500">{r.studentEmail}</div>
                    </td>
                    <td className="text-slate-300">{r.phone}</td>
                    <td className="text-slate-300">{r.class}</td>
                    <td className="text-slate-400 capitalize">{r.preferredBatchTime}</td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[r.status] || 'badge-amber'}`}>
                        {(r.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => setViewModal(r)} className="text-sm font-bold text-blue-400 cursor-pointer">View</button>
                        {r.status === 'pending' && (
                          <button onClick={() => markCalled(r)} className="text-sm font-bold text-cyan-400 cursor-pointer">Mark Called</button>
                        )}
                        {r.status !== 'approved' && r.status !== 'rejected' && (
                          <button onClick={() => openApprove(r)} className="text-sm font-bold text-green-400 cursor-pointer">Approve</button>
                        )}
                        {r.status !== 'approved' && r.status !== 'rejected' && (
                          <button onClick={() => setRejectModal(r)} className="text-sm font-bold text-red-400 cursor-pointer">Reject</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Application Details">
        {viewModal && (
          <div className="space-y-4 p-1 text-sm">
            <Row label="Student" value={`${viewModal.studentName} (${viewModal.studentEmail})`} />
            <Row label="Student ID" value={viewModal.studentId} />
            <div className="grid grid-cols-2 gap-4">
              <Row label="Phone" value={viewModal.phone} />
              <Row label="Alt Phone" value={viewModal.altPhone || '-'} />
              <Row label="Parent" value={viewModal.parentName} />
              <Row label="Parent Phone" value={viewModal.parentPhone} />
              <Row label="Class" value={viewModal.class} />
              <Row label="Board" value={viewModal.board || '-'} />
              <Row label="School" value={viewModal.school || '-'} />
              <Row label="Time Pref" value={viewModal.preferredBatchTime} />
            </div>
            <Row label="Target Exam" value={(viewModal.targetExam || []).join(', ')} />
            <Row label="Address" value={viewModal.address || '-'} />
            <Row label="Message" value={viewModal.message || '-'} />

            {viewModal.documents && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Documents</p>
                <div className="grid grid-cols-3 gap-3">
                  {viewModal.documents.photo && <DocLink url={viewModal.documents.photo} label="Photo" />}
                  {viewModal.documents.idProof && <DocLink url={viewModal.documents.idProof} label="ID Proof" />}
                  {viewModal.documents.lastMarksheet && <DocLink url={viewModal.documents.lastMarksheet} label="Marksheet" />}
                </div>
              </div>
            )}

            {viewModal.adminNotes && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Admin Note</p>
                <p className="text-white">{viewModal.adminNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve & Assign Batch">
        {approveModal && (
          <div className="space-y-4 p-1">
            <p className="text-sm text-slate-300">Approve <strong className="text-white">{approveModal.studentName}</strong> and assign to a class + batch.</p>

            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Class</label>
              <select className="input-field w-full" value={approveForm.classId} onChange={(e) => setApproveForm((s) => ({ ...s, classId: e.target.value }))}>
                <option value="">-- Select Class --</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="dropper">Dropper</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Batch</label>
              <select className="input-field w-full" value={approveForm.batchId} onChange={(e) => setApproveForm((s) => ({ ...s, batchId: e.target.value }))}>
                <option value="">-- Select Batch --</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.batchCode ? `(${b.batchCode})` : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Payment Mode</label>
              <select className="input-field w-full" value={approveForm.paymentMode} onChange={(e) => setApproveForm((s) => ({ ...s, paymentMode: e.target.value }))}>
                <option value="offline-cash">Offline — Cash</option>
                <option value="offline-upi">Offline — UPI</option>
                <option value="razorpay">Razorpay (online)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={approveForm.markPaid}
                onChange={(e) => setApproveForm((s) => ({ ...s, markPaid: e.target.checked }))}
              />
              Mark fees paid (student gets immediate batch access)
            </label>

            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Payment Note (optional)</label>
              <textarea
                className="input-field w-full"
                rows={2}
                placeholder="e.g. ₹12000 cash received at institution on 2026-05-25"
                value={approveForm.paymentNote}
                onChange={(e) => setApproveForm((s) => ({ ...s, paymentNote: e.target.value }))}
              />
            </div>

            <button onClick={confirmApprove} className="btn-primary w-full bg-green-500 hover:bg-green-600">
              Confirm Approve & Assign
            </button>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Request">
        {rejectModal && (
          <div className="space-y-4 p-1">
            <p className="text-sm text-slate-300">Reject <strong className="text-white">{rejectModal.studentName}</strong>'s application?</p>
            <textarea
              className="input-field w-full"
              rows={3}
              placeholder="Reason (shown to student)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <button onClick={confirmReject} className="btn-primary w-full bg-red-500 hover:bg-red-600">
              Confirm Reject
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  )
}

function DocLink({ url, label }) {
  const isImg = /\.(jpe?g|png|gif|webp)/i.test(url) || url.includes('image')
  return (
    <a href={url} target="_blank" rel="noopener" className="block bg-white/5 border border-white/10 rounded-lg p-2 hover:border-green-brand/30 no-underline">
      {isImg ? (
        <img src={url} alt={label} className="w-full h-24 object-cover rounded mb-1" />
      ) : (
        <div className="w-full h-24 bg-white/5 rounded mb-1 flex items-center justify-center text-slate-400">PDF</div>
      )}
      <p className="text-xs text-white text-center">{label}</p>
    </a>
  )
}
