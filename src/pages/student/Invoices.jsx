import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCollectionWhere } from '../../lib/firebaseHelpers'
import { formatCurrency } from '../../lib/invoice'
import InvoiceView from '../../components/InvoiceView'
import Modal from '../../components/Modal'

export default function Invoices() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => { if (user) loadPayments() }, [user])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await getCollectionWhere('payments', 'studentId', '==', user.studentId || user.id || '')
      setPayments(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusColors = { pending: 'badge-gold', verified: 'badge-green', rejected: 'badge-red' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Invoices</h1>
        <p className="text-slate-400 text-sm">View your payment history and invoices</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
          <p className="text-slate-400 mb-2">No payments yet</p>
          <p className="text-sm text-slate-500">Purchase a video to see invoices here</p>
        </div>
      ) : (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-white">Invoice</th>
                  <th className="text-white">Video</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Date</th>
                  <th className="text-white">Status</th>
                  <th className="text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-white">{p.invoiceNumber}</td>
                    <td className="text-white text-sm">{p.videoTitle}</td>
                    <td className="text-green-brand font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="text-slate-400 text-sm">{p.paidAt}</td>
                    <td><span className={`badge ${statusColors[p.status] || 'badge-navy'}`}>{p.status}</span></td>
                    <td>
                      <button onClick={() => setSelectedInvoice(p)} className="text-sm text-green-brand hover:text-green-light cursor-pointer font-medium">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice">
        {selectedInvoice && (
          <InvoiceView invoice={{ ...selectedInvoice, upiId: import.meta.env.VITE_UPI_ID || 'rbtmission@upi' }} onClose={() => setSelectedInvoice(null)} />
        )}
      </Modal>
    </div>
  )
}
