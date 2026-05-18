import { formatCurrency } from '../lib/invoice'

export default function InvoiceView({ invoice, onClose }) {
  const handlePrint = () => window.print()

  if (!invoice) return null

  return (
    <div className="space-y-6 print:shadow-none" id="invoice">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 pb-4 print:border-black/20">
        <div className="flex items-center gap-3">
          <img src="/Images/RBT Logo.jpeg" alt="RBT" className="w-12 h-12 rounded-lg" />
          <div>
            <h2 className="text-lg font-bold text-white print:text-black">RBT Mission Learning</h2>
            <p className="text-xs text-slate-400 print:text-slate-600">Mission Hai Toh Perfect Learning Chahiye</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-green-brand">INVOICE</p>
          <p className="text-xs text-slate-400 print:text-slate-600">{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 print:text-slate-500 uppercase tracking-wider mb-1">Bill To</p>
          <p className="text-sm font-semibold text-white print:text-black">{invoice.studentName}</p>
          {invoice.studentEmail && <p className="text-xs text-slate-400">{invoice.studentEmail}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 print:text-slate-500 uppercase tracking-wider mb-1">Date</p>
          <p className="text-sm text-white print:text-black">{invoice.date}</p>
        </div>
      </div>

      {/* Items */}
      <div className="border border-white/10 rounded-xl overflow-hidden print:border-black/20">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 print:bg-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 print:text-slate-600 p-3 uppercase">Item</th>
              <th className="text-right text-xs font-semibold text-slate-400 print:text-slate-600 p-3 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/10 print:border-black/10">
              <td className="p-3">
                <p className="text-sm font-medium text-white print:text-black">{invoice.videoTitle}</p>
                {invoice.videoSubject && <p className="text-xs text-slate-400">{invoice.videoSubject}</p>}
              </td>
              <td className="p-3 text-right text-sm font-semibold text-white print:text-black">
                {formatCurrency(invoice.amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-white/5 print:bg-slate-50 print:border-black/10">
              <td className="p-3 text-sm font-bold text-white print:text-black">Total</td>
              <td className="p-3 text-right text-lg font-bold text-green-brand">{formatCurrency(invoice.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Info */}
      <div className="bg-white/5 print:bg-slate-50 rounded-xl p-4 space-y-2 print:border print:border-black/10">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 print:text-slate-600">Payment Method</span>
          <span className="text-white print:text-black font-medium">UPI / Google Pay</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 print:text-slate-600">UPI ID</span>
          <span className="text-white print:text-black font-medium">{invoice.upiId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 print:text-slate-600">Transaction ID</span>
          <span className="text-white print:text-black font-mono text-xs">{invoice.transactionId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 print:text-slate-600">Status</span>
          <span className="badge badge-green">{invoice.status}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 print:hidden">
        <button onClick={handlePrint} className="btn-primary flex-1">
          Print Invoice
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-navy flex-1">
            Close
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 print:text-slate-400">
        Thank you for learning with RBT Mission Learning!
      </p>
    </div>
  )
}
