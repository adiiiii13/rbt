import { TableSkeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast'
import { updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { formatCurrency } from '../../lib/invoice'
import { useState } from 'react'
import Modal from '../../components/Modal'
import InvoiceView from '../../components/InvoiceView'
import ExportButton from '../../components/ExportButton'
import CreateInvoiceModal from '../../components/CreateInvoiceModal'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ManagePayments() {
  const { data: payments, loading } = useRealtimeCollection('payments')
  const { data: settings } = useRealtimeCollection('settings')
  const { data: invoices } = useRealtimeCollection('invoices', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'dues'
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const [isEditRevenueModalOpen, setIsEditRevenueModalOpen] = useState(false)
  const [revenueInput, setRevenueInput] = useState('')

  const overrideRevenue = settings?.find(s => s.id === 'revenue')?.overrideAmount

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

  const deleteInvoiceRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      try {
        await deleteDocument('invoices', id)
        toast.success('Invoice deleted')
      } catch (err) { toast.error(err.message || 'Delete failed') }
    }
  }

  const deletePayment = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
      try {
        await deleteDocument('payments', id)
        toast.success('Payment deleted')
      } catch (err) { toast.error(err.message || 'Delete failed') }
    }
  }

  const remind = async (inv) => {
    try {
      await updateDocument('invoices', inv.id, { remindedAt: new Date().toISOString() })
      toast.success('Reminder logic executed')
    } catch(e) {
      toast.error(e.message)
    }
  }

  const openEditRevenueModal = () => {
    setRevenueInput(overrideRevenue !== undefined && overrideRevenue !== null ? overrideRevenue.toString() : '');
    setIsEditRevenueModalOpen(true);
  }

  const saveRevenue = async () => {
    try {
      if (revenueInput.trim() === '') {
        await setDoc(doc(db, 'settings', 'revenue'), { overrideAmount: null }, { merge: true })
        toast.success('Revenue calculation set to automatic')
      } else {
        const num = parseFloat(revenueInput);
        if (isNaN(num)) throw new Error("Invalid amount");
        await setDoc(doc(db, 'settings', 'revenue'), { overrideAmount: num }, { merge: true })
        toast.success('Total revenue updated')
      }
      setIsEditRevenueModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Update failed')
    }
  }

  const calculatedRevenue = payments
    .filter((p) => p.status === 'verified' || p.status === 'paid' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalRevenue = overrideRevenue !== undefined && overrideRevenue !== null ? overrideRevenue : calculatedRevenue;

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Payments</h1>
          <p className="text-sm text-slate-400">Transactions and Dues</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'dues' ? (
            <button onClick={() => setIsInvoiceModalOpen(true)} className="btn-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create Invoice
            </button>
          ) : (
            <ExportButton data={payments} filename="payments" columns={[
              { key: 'invoiceNumber', label: 'Invoice #' },
              { key: 'paymentId', label: 'Payment ID' },
              { key: 'studentName', label: 'Student' },
              { key: 'studentEmail', label: 'Email' },
              { key: 'videoTitle', label: 'Video' },
              { key: 'courseTitle', label: 'Course' },
              { key: 'amount', label: 'Amount (₹)' },
              { key: 'gpayTransactionId', label: 'UPI Txn ID' },
              { key: 'status', label: 'Status' },
              { key: 'verifiedAt', label: 'Verified At' },
              { key: 'rejectedAt', label: 'Rejected At' },
            ]} />
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'all' ? 'text-green-brand border-b-2 border-green-brand' : 'text-slate-400 hover:text-white'}`}
        >
          All Payments
        </button>
        <button 
          onClick={() => setActiveTab('dues')} 
          className={`pb-2 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'dues' ? 'text-green-brand border-b-2 border-green-brand' : 'text-slate-400 hover:text-white'}`}
        >
          Dues
          {invoices.filter(i => i.status === 'pending').length > 0 && (
            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-xs">{invoices.filter(i => i.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <div className="flex justify-between items-start mb-1">
            <p className="text-xs text-slate-400">Total Revenue</p>
            <button 
              onClick={openEditRevenueModal}
              className="text-xs text-slate-500 hover:text-white transition-colors"
              title="Edit Revenue"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
          </div>
          <p className="text-xl font-bold text-green-brand">{formatCurrency(totalRevenue)}</p>
          {overrideRevenue !== undefined && overrideRevenue !== null && (
            <p className="text-[10px] text-slate-500 mt-1">Manual Override Active</p>
          )}
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
                        <button 
                          onClick={() => deletePayment(p.id)} 
                          className="text-xs text-red-500 font-bold cursor-pointer hover:text-red-400 transition-colors"
                        >
                          Delete
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
      </>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Invoice #</th>
                  <th className="text-white">Student</th>
                  <th className="text-white">Service / Batch</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Due Date</th>
                  <th className="text-white">Status</th>
                  <th className="text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.filter(inv => inv.status === 'pending').map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs text-white">{inv.invoiceNumber}</td>
                    <td className="text-white text-sm">
                      {inv.studentName}
                      <span className="block text-xs text-slate-400">{inv.studentEmail}</span>
                    </td>
                    <td className="text-slate-300 text-sm">{inv.courseName}</td>
                    <td className="text-green-brand font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="text-slate-400 text-sm">{inv.dueDate || 'No Due Date'}</td>
                    <td><span className="badge badge-gold">Pending</span></td>
                    <td>
                      <div className="flex gap-3 items-center">
                        <button onClick={() => remind(inv)} className="text-xs text-amber-500 font-bold hover:text-amber-400">Remind</button>
                        <button onClick={() => deleteInvoiceRecord(inv.id)} className="text-xs text-red-500 font-bold hover:text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.filter(inv => inv.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No pending dues found.
                    </td>
                  </tr>
                )}
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

      {/* Edit Revenue Modal */}
      <Modal isOpen={isEditRevenueModalOpen} onClose={() => setIsEditRevenueModalOpen(false)} title="Edit Total Revenue">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Enter new total revenue override amount. Leave blank to automatically calculate from invoices.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Override Amount (₹)</label>
            <input
              type="number"
              value={revenueInput}
              onChange={(e) => setRevenueInput(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditRevenueModalOpen(false)}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveRevenue}
              className="flex-1 px-4 py-3 bg-green-brand hover:bg-green-500 text-[#0a0a0a] rounded-xl font-bold transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <CreateInvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        students={students} 
        invoicesCount={invoices.length} 
      />
    </div>
  )
}
