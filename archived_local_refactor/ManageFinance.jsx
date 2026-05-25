import { useState, useMemo } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { updateDocument, deleteDocument, addDocument } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import InvoiceView from '../../components/InvoiceView'
import ExportButton from '../../components/ExportButton'
import CreateInvoiceModal from '../../components/CreateInvoiceModal'

export default function ManageFinance() {
  const { data: payments, loading: loadingPayments } = useRealtimeCollection('payments', { fallback: [] })
  const { data: invoices, loading: loadingInvoices } = useRealtimeCollection('invoices', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const { data: settings } = useRealtimeCollection('settings')

  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'invoices'
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditRevenueModalOpen, setIsEditRevenueModalOpen] = useState(false)
  const [revenueInput, setRevenueInput] = useState('')
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null)
  const [recordPaymentForm, setRecordPaymentForm] = useState({ type: 'full', customAmount: '' })

  // Overrides and Revenue
  const overrideRevenue = settings?.find(s => s.id === 'revenue')?.overrideAmount
  const calculatedRevenue = payments
    .filter(p => p.status === 'verified' || p.status === 'paid' || p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalRevenue = overrideRevenue !== undefined && overrideRevenue !== null ? overrideRevenue : calculatedRevenue

  // Grouped Invoices
  const groups = useMemo(() => {
    const map = new Map()
    invoices.forEach(inv => {
      const key = inv.studentUid || inv.studentEmail || 'unknown'
      if (!map.has(key)) map.set(key, { uid: key, name: inv.studentName, email: inv.studentEmail, items: [], total: 0, paid: 0, pending: 0 })
      const g = map.get(key)
      g.items.push(inv)
      g.total += Number(inv.amount) || 0
      if (inv.status === 'paid') g.paid += Number(inv.amount) || 0
      else if (inv.status === 'partial') {
        g.paid += Number(inv.paidAmount) || 0
        g.pending += Number(inv.dueAmount) || 0
      }
      else if (inv.status === 'pending') g.pending += Number(inv.amount) || 0
    })
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending)
  }, [invoices])

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length
  const totalPendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'partial').reduce((s, i) => s + (i.dueAmount !== undefined ? i.dueAmount : (i.amount || 0)), 0)

  // Actions
  const saveRevenue = async () => {
    try {
      if (revenueInput.trim() === '') {
        await setDoc(doc(db, 'settings', 'revenue'), { overrideAmount: null }, { merge: true })
        toast.success('Revenue calculation set to automatic')
      } else {
        const num = parseFloat(revenueInput)
        if (isNaN(num)) throw new Error("Invalid amount")
        await setDoc(doc(db, 'settings', 'revenue'), { overrideAmount: num }, { merge: true })
        toast.success('Total revenue updated')
      }
      setIsEditRevenueModalOpen(false)
    } catch (err) { toast.error(err.message || 'Update failed') }
  }

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

  const deletePayment = async (id) => {
    if (!confirm("Delete transaction? Cannot be undone.")) return
    try { await deleteDocument('payments', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const handleRecordPayment = async () => {
    if (!recordPaymentInvoice) return;
    
    if (recordPaymentForm.type === 'custom') {
      const customAmt = Number(recordPaymentForm.customAmount);
      if (!customAmt || customAmt <= 0) { toast.error('Enter a valid amount'); return; }
      
      const currentDue = Number(recordPaymentInvoice.dueAmount !== undefined ? recordPaymentInvoice.dueAmount : recordPaymentInvoice.amount);
      if (customAmt > currentDue) { toast.error('Amount exceeds due amount'); return; }
      
      const newPaid = Number(recordPaymentInvoice.paidAmount || 0) + customAmt;
      const newDue = currentDue - customAmt;
      const newStatus = newDue <= 0 ? 'paid' : 'partial';
      
      try {
        await updateDocument('invoices', recordPaymentInvoice.id, {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          paidAt: newStatus === 'paid' ? new Date().toISOString() : recordPaymentInvoice.paidAt
        });
        
        try {
          await addDocument('notifications', {
            studentUid: recordPaymentInvoice.studentUid,
            studentName: recordPaymentInvoice.studentName,
            studentEmail: recordPaymentInvoice.studentEmail,
            subject: `Payment Recorded for Invoice ${recordPaymentInvoice.invoiceNumber}`,
            message: `A payment of ${formatCurrency(customAmt)} was recorded for ${recordPaymentInvoice.courseName}. ${newDue > 0 ? `Remaining due: ${formatCurrency(newDue)}` : 'Invoice fully paid!'}`,
            audience: 'invoice',
            read: false,
          });
        } catch (err) { console.error('Notification failed', err) }
        toast.success(`Payment of ${formatCurrency(customAmt)} recorded!`);
        setRecordPaymentInvoice(null);
      } catch (err) { toast.error('Failed: ' + err.message) }
      
    } else {
      // Full Payment
      try {
        await updateDocument('invoices', recordPaymentInvoice.id, { 
          status: 'paid', 
          paidAmount: Number(recordPaymentInvoice.amount),
          dueAmount: 0,
          paidAt: new Date().toISOString() 
        })
        try {
          await addDocument('notifications', {
            studentUid: recordPaymentInvoice.studentUid,
            studentName: recordPaymentInvoice.studentName,
            studentEmail: recordPaymentInvoice.studentEmail,
            subject: `Invoice ${recordPaymentInvoice.invoiceNumber} marked fully paid`,
            message: `Payment received for ${recordPaymentInvoice.courseName}.`,
            audience: 'invoice',
            read: false,
          })
        } catch (err) { console.error('Notification failed', err) }
        toast.success('Invoice marked fully paid')
        setRecordPaymentInvoice(null);
      } catch (err) { toast.error('Failed: ' + err.message) }
    }
  }

  const deleteInvoiceRecord = async (id) => {
    if (!confirm("Delete invoice? Cannot be undone.")) return
    try { await deleteDocument('invoices', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const remindInvoice = async (inv) => {
    try {
      await updateDocument('invoices', inv.id, { remindedAt: new Date().toISOString() })
      await addDocument('notifications', {
        studentUid: inv.studentUid,
        studentName: inv.studentName,
        studentEmail: inv.studentEmail,
        subject: `Reminder: Invoice ${inv.invoiceNumber}`,
        message: `${inv.courseName} — ${formatCurrency(inv.amount)}${inv.dueDate ? ` · due ${inv.dueDate}` : ''}. Please complete payment.`,
        audience: 'invoice',
        read: false,
      })

      if (inv.studentEmail) {
        const dueAmountVal = inv.dueAmount !== undefined ? inv.dueAmount : inv.amount;
        const msgHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Invoice Reminder</h2>
            <p style="color: #334155;">Dear <strong>${inv.studentName}</strong>,</p>
            <p style="color: #334155;">This is a friendly reminder regarding your invoice (<b>${inv.invoiceNumber}</b>).</p>
            <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
              <p style="margin: 5px 0;"><b>Item:</b> ${inv.courseName}</p>
              <p style="margin: 5px 0;"><b>Total Amount:</b> ${formatCurrency(inv.amount)}</p>
              <p style="margin: 5px 0; color: #ef4444;"><b>Amount Due:</b> ${formatCurrency(dueAmountVal)}</p>
              ${inv.dueDate ? `<p style="margin: 5px 0; color: #ef4444;"><b>Due Date:</b> ${inv.dueDate}</p>` : ''}
            </div>
            <p style="color: #334155;">Please log in to your student dashboard to view and complete the payment.</p>
            <br/>
            <p style="color: #64748b; font-size: 14px;">Best regards,<br/><b>RBT Mission Learning</b></p>
          </div>
        `;
        await addDocument('mail', {
          to: inv.studentEmail,
          message: {
            subject: `Reminder: Invoice ${inv.invoiceNumber} - RBT Mission Learning`,
            html: msgHtml
          },
          createdAt: new Date(),
        });
      }

      toast.success('Reminder sent')
    } catch (e) { toast.error(e.message) }
  }

  const statusColors = { pending: 'badge-gold', partial: 'badge-gold', verified: 'badge-green', paid: 'badge-green', success: 'badge-green', rejected: 'badge-red', overdue: 'badge-red' }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance & Billing</h1>
          <p className="text-sm text-slate-400">Transactions, revenue, and invoices</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('transactions')} 
          className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'transactions' ? 'text-green-brand border-b-2 border-green-brand' : 'text-slate-400 hover:text-white'}`}
        >
          Transactions
        </button>
        <button 
          onClick={() => setActiveTab('invoices')} 
          className={`pb-2 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'invoices' ? 'text-green-brand border-b-2 border-green-brand' : 'text-slate-400 hover:text-white'}`}
        >
          Manual Invoices
          {invoices.filter(i => i.status === 'pending' || i.status === 'partial').length > 0 && (
            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-xs">{invoices.filter(i => i.status === 'pending' || i.status === 'partial').length}</span>
          )}
        </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-slate-400">Total Revenue</p>
                <button onClick={() => { setRevenueInput(overrideRevenue !== undefined && overrideRevenue !== null ? overrideRevenue.toString() : ''); setIsEditRevenueModalOpen(true) }} className="text-xs text-slate-500 hover:text-white transition-colors" title="Edit Revenue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                </button>
              </div>
              <p className="text-xl font-bold text-green-brand">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Pending Verification</p>
              <p className="text-xl font-bold text-amber-500">{pendingPaymentsCount}</p>
            </div>
            <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Total Transactions</p>
              <p className="text-xl font-bold text-white">{payments.length}</p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <ExportButton data={payments} filename="transactions" columns={[
                { key: 'invoiceNumber', label: 'Invoice #' },
                { key: 'studentName', label: 'Student' },
                { key: 'videoTitle', label: 'Video/Course' },
                { key: 'amount', label: 'Amount (₹)' },
                { key: 'status', label: 'Status' }
            ]} />
          </div>

          {loadingPayments ? <TableSkeleton /> : (
            <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th className="text-white">Transaction / Invoice</th>
                      <th className="text-white">Student</th>
                      <th className="text-white">Item</th>
                      <th className="text-white">Amount</th>
                      <th className="text-white">Status</th>
                      <th className="text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs text-white">{p.invoiceNumber || p.paymentId || p.id}</td>
                        <td className="text-white text-sm">{p.studentName}</td>
                        <td className="text-slate-300 text-sm">{p.videoTitle || p.courseTitle || 'Course Purchase'}</td>
                        <td className="text-green-brand font-semibold">{formatCurrency(p.amount)}</td>
                        <td><span className={`badge ${statusColors[p.status] || 'bg-slate-500/20 text-slate-400'}`}>{p.status}</span></td>
                        <td>
                          <div className="flex gap-3 items-center">
                            <button onClick={() => setSelectedInvoice(p)} className="text-xs text-blue-400 font-bold cursor-pointer">Download</button>
                            {p.status === 'pending' && (
                              <>
                                <button onClick={() => verifyPayment(p.id)} className="text-xs text-green-brand font-bold cursor-pointer">Verify</button>
                                <button onClick={() => rejectPayment(p.id)} className="text-xs text-red-500 font-bold cursor-pointer">Reject</button>
                              </>
                            )}
                            <button onClick={() => deletePayment(p.id)} className="text-xs text-red-500 font-bold cursor-pointer">Delete</button>
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Outstanding Invoices</p>
              <p className="text-xl font-bold text-amber-500">{formatCurrency(totalPendingInvoices)}</p>
            </div>
            <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Total Manual Invoices</p>
              <p className="text-xl font-bold text-white">{invoices.length}</p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
             <ExportButton data={invoices} filename="invoices" columns={[
              { key: 'invoiceNumber', label: 'Invoice #' },
              { key: 'studentName', label: 'Student' },
              { key: 'courseName', label: 'Course' },
              { key: 'amount', label: 'Amount (₹)' },
              { key: 'status', label: 'Status' }
            ]} />
          </div>

          {loadingInvoices ? <TableSkeleton /> : (
            <div className="space-y-4">
              {groups.map(g => (
                <div key={g.uid} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-white">{g.name || '(no name)'}</div>
                      <div className="text-xs text-slate-500">{g.email || g.uid}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">{g.items.length} invoice(s)</span>
                      {g.pending > 0 && <span className="badge badge-gold">Due {formatCurrency(g.pending)}</span>}
                      {g.paid > 0 && <span className="badge badge-green">Paid {formatCurrency(g.paid)}</span>}
                    </div>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th className="text-white">Invoice #</th>
                          <th className="text-white">Course</th>
                          <th className="text-white">Amount</th>
                          <th className="text-white">Due</th>
                          <th className="text-white">Status</th>
                          <th className="text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map(inv => (
                          <tr key={inv.id}>
                            <td className="font-mono text-xs text-white">{inv.invoiceNumber}</td>
                            <td className="text-slate-300 text-sm">
                              <div>{inv.courseName}</div>
                              {inv.description && <div className="text-xs text-slate-500">{inv.description}</div>}
                            </td>
                            <td className="text-sm">
                              <div className="text-white font-semibold">{formatCurrency(inv.amount)}</div>
                              {inv.paidAmount > 0 && <div className="text-xs text-green-brand">Paid: {formatCurrency(inv.paidAmount)}</div>}
                              {(inv.status === 'partial' || inv.status === 'pending') && <div className="text-xs text-amber-500">Due: {formatCurrency(inv.dueAmount !== undefined ? inv.dueAmount : inv.amount)}</div>}
                            </td>
                            <td className="text-slate-400 text-sm">{inv.dueDate || '—'}</td>
                            <td><span className={`badge ${statusColors[inv.status] || 'badge-navy'}`}>{inv.status}</span></td>
                            <td>
                              <div className="flex gap-2">
                                <button onClick={() => setSelectedInvoice({
                                    invoiceNumber: inv.invoiceNumber, date: inv.issuedDate || inv.paidAt || '—',
                                    studentName: inv.studentName, studentEmail: inv.studentEmail,
                                    courseTitle: inv.courseName, description: inv.description,
                                    amount: inv.amount, transactionId: inv.id,
                                    paymentMethod: 'Invoice (manual)', status: inv.status === 'paid' ? 'Paid' : 'Pending',
                                  })} className="text-xs text-blue-400 cursor-pointer">View</button>
                                {inv.status === 'partial' && (
                                  <button onClick={() => { setRecordPaymentForm({ type: 'full', customAmount: '' }); setRecordPaymentInvoice(inv) }} className="text-xs text-green-brand font-bold cursor-pointer">Record Payment</button>
                                )}
                                {(inv.status === 'pending' || inv.status === 'partial') && (
                                  <>
                                    {inv.status === 'pending' && <button onClick={() => { setRecordPaymentForm({ type: 'full', customAmount: '' }); setRecordPaymentInvoice(inv) }} className="text-xs text-green-brand font-bold cursor-pointer">Record Payment</button>}
                                    <button onClick={() => remindInvoice(inv)} className="text-xs text-amber-400 cursor-pointer">Remind</button>
                                  </>
                                )}
                                <button onClick={() => deleteInvoiceRecord(inv.id)} className="text-xs text-red-400 cursor-pointer">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="bg-[#111111] p-12 text-center text-slate-400">No manual invoices found.</div>
              )}
            </div>
          )}
        </>
      )}

      <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} students={students} invoicesCount={invoices.length} />

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice Preview" size="lg">
        {selectedInvoice && <InvoiceView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      </Modal>

      <Modal isOpen={isEditRevenueModalOpen} onClose={() => setIsEditRevenueModalOpen(false)} title="Edit Total Revenue">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Set a custom manual revenue override. Leave blank to calculate automatically.</p>
          <input type="number" className="input-field w-full" placeholder="e.g. 50000" value={revenueInput} onChange={e => setRevenueInput(e.target.value)} />
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setIsEditRevenueModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-medium cursor-pointer">Cancel</button>
            <button onClick={saveRevenue} className="btn-primary">Save Revenue</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!recordPaymentInvoice} onClose={() => setRecordPaymentInvoice(null)} title="Record Payment">
        {recordPaymentInvoice && (
          <div className="space-y-5">
            <div className="bg-[#111111] border border-slate-800 p-4 rounded-xl">
              <p className="text-white text-sm mb-1"><strong>Invoice:</strong> {recordPaymentInvoice.invoiceNumber}</p>
              <p className="text-slate-300 text-sm mb-1"><strong>Total Amount:</strong> {formatCurrency(recordPaymentInvoice.amount)}</p>
              <p className="text-amber-500 font-bold text-sm"><strong>Currently Due:</strong> {formatCurrency(recordPaymentInvoice.dueAmount !== undefined ? recordPaymentInvoice.dueAmount : recordPaymentInvoice.amount)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Payment Type</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setRecordPaymentForm({ ...recordPaymentForm, type: 'full' })} 
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${recordPaymentForm.type === 'full' ? 'border-green-brand bg-green-brand/10 text-green-brand' : 'border-slate-700 bg-white/5 text-slate-400'}`}>
                  Pay in Full
                </button>
                <button 
                  onClick={() => setRecordPaymentForm({ ...recordPaymentForm, type: 'custom' })} 
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${recordPaymentForm.type === 'custom' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-white/5 text-slate-400'}`}>
                  Custom Amount
                </button>
              </div>
            </div>

            {recordPaymentForm.type === 'custom' && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Amount Paid Offline (₹) *</label>
                <input 
                  type="number" 
                  className="input-field w-full" 
                  placeholder="e.g. 500" 
                  value={recordPaymentForm.customAmount} 
                  onChange={e => setRecordPaymentForm({ ...recordPaymentForm, customAmount: e.target.value })} 
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setRecordPaymentInvoice(null)} className="px-4 py-2 text-slate-400 hover:text-white font-medium cursor-pointer">Cancel</button>
              <button onClick={handleRecordPayment} className="btn-primary">Confirm Payment</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
