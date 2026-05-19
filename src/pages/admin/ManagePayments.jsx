import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getCollection, updateDocument } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'

export default function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPayments() }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await getCollection('payments')
      setPayments(data)
    } catch (err) {
      console.error('[payments]', err)
      toast.error('Failed to load payments')
    } finally { setLoading(false) }
  }

  const verifyPayment = async (id) => {
    try {
      await updateDocument('payments', id, { status: 'verified', verifiedAt: new Date().toISOString() })
      toast.success('Payment verified')
      loadPayments()
    } catch (err) { toast.error(err.message || 'Verify failed') }
  }

  const rejectPayment = async (id) => {
    try {
      await updateDocument('payments', id, { status: 'rejected', rejectedAt: new Date().toISOString() })
      toast.success('Payment rejected')
      loadPayments()
    } catch (err) { toast.error(err.message || 'Reject failed') }
  }

  const totalRevenue = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingCount = payments.filter((p) => p.status === 'pending').length

  const statusColors = {
    pending: 'badge-gold',
    verified: 'badge-green',
    rejected: 'badge-red',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Payments</h1>
          <p className="text-sm text-slate-400">{payments.length} transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-brand">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Pending Verification</p>
          <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Transactions</p>
          <p className="text-xl font-bold text-white">{payments.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Invoice</th>
                  <th className="text-white">Student</th>
                  <th className="text-white">Video</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Transaction ID</th>
                  <th className="text-white">Status</th>
                  <th className="text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-white">{p.invoiceNumber}</td>
                    <td className="text-white text-sm">{p.studentName}</td>
                    <td className="text-slate-300 text-sm">{p.videoTitle}</td>
                    <td className="text-green-brand font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="font-mono text-xs text-slate-400">{p.gpayTransactionId}</td>
                    <td><span className={`badge ${statusColors[p.status]}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => verifyPayment(p.id)} className="text-xs text-green-brand font-bold cursor-pointer">Verify</button>
                          <button onClick={() => rejectPayment(p.id)} className="text-xs text-red-500 font-bold cursor-pointer">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
