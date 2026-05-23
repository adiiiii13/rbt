import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ListSkeleton } from '../../components/ui/Skeleton'
import { getCollectionWhere, updateDocument, addDocument } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'
import { openRazorpayClient } from '../../lib/razorpayClient'
import InvoiceView from '../../components/InvoiceView'
import Modal from '../../components/Modal'
import { EyeIcon, ReceiptIcon } from '../../components/Icons'
import toast from 'react-hot-toast'

export default function Invoices() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('all') // 'all' | 'pending' | 'paid'

  const load = async () => {
    setLoading(true)
    try {
      const sid = user.studentId || user.id || ''
      const uid = user.id || user.uid || ''
      const [pays, invsByUid, invsByEmail] = await Promise.all([
        getCollectionWhere('payments', 'studentId', '==', sid),
        getCollectionWhere('invoices', 'studentUid', '==', uid),
        user.email ? getCollectionWhere('invoices', 'studentEmail', '==', user.email) : Promise.resolve([]),
      ])
      // Dedupe invoices by id
      const invMap = new Map()
      ;[...invsByUid, ...invsByEmail].forEach(i => invMap.set(i.id, i))
      setPayments(pays)
      setInvoices(Array.from(invMap.values()))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user])

  // Unified rows: invoices (manual) + payments (video purchases)
  const rows = [
    ...invoices.map(i => ({
      id: i.id,
      kind: 'invoice',
      invoiceNumber: i.invoiceNumber,
      title: i.courseName,
      subtitle: i.description || '',
      amount: i.amount,
      date: i.issuedDate || i.paidAt || i.dueDate || '—',
      status: i.status,
      raw: i,
    })),
    ...payments.map(p => ({
      id: p.id,
      kind: 'payment',
      invoiceNumber: p.invoiceNumber,
      title: p.videoTitle,
      subtitle: p.method === 'razorpay' ? 'Razorpay' : 'UPI',
      amount: p.amount,
      date: p.paidAt,
      status: p.status,
      raw: p,
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const filtered = tab === 'all' ? rows
    : tab === 'pending' ? rows.filter(r => r.status === 'pending')
    : rows.filter(r => r.status === 'paid' || r.status === 'verified')

  const openView = (r) => {
    if (r.kind === 'invoice') {
      const i = r.raw
      setSelected({
        invoiceNumber: i.invoiceNumber, date: i.issuedDate || i.paidAt || '—',
        studentName: i.studentName, studentEmail: i.studentEmail,
        courseTitle: i.courseName, description: i.description,
        amount: i.amount, transactionId: i.id,
        paymentMethod: 'Invoice', status: i.status === 'paid' ? 'Paid' : 'Pending',
      })
    } else {
      const p = r.raw
      setSelected({ ...p, upiId: p.method === 'razorpay' ? 'razorpay' : (import.meta.env.VITE_UPI_ID || 'rbtmission@upi') })
    }
  }

  const totalPaid = rows.filter(r => r.status === 'paid' || r.status === 'verified').reduce((s, r) => s + (r.amount || 0), 0)
  const totalPending = rows.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0)

  const handlePay = (r) => {
    openRazorpayClient({
      amount: r.amount,
      name: r.title,
      description: r.subtitle || 'Invoice Payment',
      user: user,
      onSuccess: async (res) => {
        try {
          // Update invoice status
          await updateDocument('invoices', r.id, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            paymentId: res.paymentId
          })
          
          // Create payments record
          await addDocument('payments', {
            type: 'razorpay_invoice',
            studentId: user.studentId || user.id,
            studentUid: user.uid || user.id,
            studentName: user.name,
            studentEmail: user.email,
            invoiceNumber: r.invoiceNumber,
            courseTitle: r.title,
            amount: r.amount,
            method: 'razorpay',
            paymentId: res.paymentId,
            status: 'verified', // Manual invoices paid via razorpay are auto-verified
            paidAt: new Date().toISOString()
          })
          
          toast.success('Payment successful!')
          load() // reload to show updated status
        } catch (e) {
          toast.error('Payment verified but failed to update status.')
        }
      },
      onFailure: (err) => toast.error(err.message || 'Payment failed')
    })
  }

  const statusColors = { pending: 'badge-gold', verified: 'badge-green', paid: 'badge-green', rejected: 'badge-red' }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
          <ReceiptIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Invoices</h1>
          <p className="text-slate-400 text-sm">Payment history + admin-issued invoices</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Paid</p>
          <p className="text-lg font-bold text-green-brand">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Due</p>
          <p className="text-lg font-bold text-amber-500">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Records</p>
          <p className="text-lg font-bold text-white">{rows.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-black/30 p-1 rounded-lg w-fit">
        {['all', 'pending', 'paid'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium capitalize ${tab === t ? 'bg-green-brand text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8"><ListSkeleton count={4} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
          <ReceiptIcon size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No {tab !== 'all' ? tab : ''} invoices</p>
          <p className="text-sm text-slate-500">Purchases and admin invoices appear here</p>
        </div>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Invoice #</th>
                  <th className="text-white">Item</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Date</th>
                  <th className="text-white">Status</th>
                  <th className="text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={`${r.kind}-${r.id}`}>
                    <td className="font-mono text-xs text-white">{r.invoiceNumber}</td>
                    <td className="text-white text-sm">
                      <div>{r.title}</div>
                      {r.subtitle && <div className="text-xs text-slate-500">{r.subtitle}</div>}
                    </td>
                    <td className="text-green-brand font-semibold">{formatCurrency(r.amount)}</td>
                    <td className="text-slate-400 text-sm">{r.date}</td>
                    <td><span className={`badge ${statusColors[r.status] || 'badge-navy'}`}>{r.status}</span></td>
                    <td>
                      <div className="flex gap-3 items-center">
                        <button onClick={() => openView(r)} className="text-sm text-green-brand hover:text-green-light cursor-pointer font-medium inline-flex items-center gap-1.5">
                          <EyeIcon size={14} /> View
                        </button>
                        {r.kind === 'invoice' && r.status === 'pending' && (
                          <button onClick={() => handlePay(r)} className="px-3 py-1 bg-green-brand text-black font-bold rounded-lg hover:bg-green-500 transition-colors text-sm">
                            Pay Now
                          </button>
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

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Invoice" size="lg">
        {selected && <InvoiceView invoice={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </div>
  )
}
