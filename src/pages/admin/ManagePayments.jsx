import { TableSkeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast'
import { updateDocument } from '../../lib/firebaseHelpers'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { formatCurrency } from '../../lib/invoice'
import { useState } from 'react'
import Modal from '../../components/Modal'
import InvoiceView from '../../components/InvoiceView'

export default function ManagePayments() {
  const { data: payments, loading } = useRealtimeCollection('payments')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const verifyPayment = async (id) => {
    try {
      await updateDocument('payments', id, { status: 'verified', verifiedAt: new Date().toISOString() })
      toast.success('Payment verified')
    } catch (err) { toast.error(err.message || 'Verify failed') }
  }

  const rejectPayment = async (id) => {
    try {
      await updateDocument('payments', id, { status: 'rejected', rejectedAt: new Date().toISOString() })
      toast.success('Payment rejected')
    } catch (err) { toast.error(err.message || 'Reject failed') }
  }

  const totalRevenue = payments
    .filter((p) => p.status === 'verified' || p.status === 'paid' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingCount = payments.filter((p) => p.status === 'pending').length

  const statusColors = {
    pending: 'badge-gold',
    verified: 'badge-green',
    rejected: 'badge-red',
    paid: 'badge-green',
    success: 'badge-green',
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
        <div className="py-8"><TableSkeleton /></div>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Invoice</th>
                  <th className="text-white">Student</th>
                  <th className="text-white">Video / Course</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Transaction ID</th>
                  <th className="text-white">Status</th>
                  <th className="text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-white">{p.invoiceNumber || p.paymentId || p.id}</td>
                    <td className="text-white text-sm">{p.studentName}</td>
                    <td className="text-slate-300 text-sm">{p.videoTitle || p.courseTitle || 'Course Purchase'}</td>
                    <td className="text-green-brand font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="font-mono text-xs text-slate-400">{p.gpayTransactionId || p.paymentId || p.id}</td>
                    <td><span className={`badge ${statusColors[p.status] || 'bg-slate-500/20 text-slate-400'}`}>{p.status}</span></td>
                    <td>
                      <div className="flex gap-3 items-center">
                        <button 
                          onClick={() => setSelectedInvoice(p)} 
                          className="text-xs text-blue-400 font-bold cursor-pointer hover:text-blue-300 transition-colors"
                        >
                          Download
                        </button>
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => verifyPayment(p.id)} className="text-xs text-green-brand font-bold cursor-pointer hover:text-green-400 transition-colors">Verify</button>
                            <button onClick={() => rejectPayment(p.id)} className="text-xs text-red-500 font-bold cursor-pointer hover:text-red-400 transition-colors">Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Details">
        {selectedInvoice && (
          <InvoiceView 
            invoice={{
              invoiceNumber: selectedInvoice.invoiceNumber || selectedInvoice.paymentId || selectedInvoice.id,
              date: selectedInvoice.paidAt?.toDate ? new Date(selectedInvoice.paidAt.toDate()).toLocaleString() : new Date(selectedInvoice.createdAt?.toDate?.() || Date.now()).toLocaleString(),
              studentName: selectedInvoice.studentName || 'Student',
              studentEmail: selectedInvoice.studentEmail || '',
              videoTitle: selectedInvoice.videoTitle || selectedInvoice.courseTitle || 'Course Enrollment',
              amount: selectedInvoice.amount,
              transactionId: selectedInvoice.gpayTransactionId || selectedInvoice.paymentId || selectedInvoice.id,
              paymentMethod: selectedInvoice.type === 'razorpay_webhook' || selectedInvoice.type === 'razorpay' || selectedInvoice.paymentId ? 'Razorpay' : 'UPI / Google Pay',
              upiId: (selectedInvoice.type === 'razorpay_webhook' || selectedInvoice.type === 'razorpay' || selectedInvoice.paymentId) ? null : (import.meta.env.VITE_UPI_ID || 'rbtmission@upi'),
              status: selectedInvoice.status
            }}
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </Modal>
    </div>
  )
}
