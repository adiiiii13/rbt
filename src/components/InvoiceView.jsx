import { formatCurrency } from '../lib/invoice'

export default function InvoiceView({ invoice, onClose }) {
  const handlePrint = () => window.print()

  if (!invoice) return null

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-10 text-slate-900 relative overflow-hidden" id="invoice">
      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] z-0">
        <img src="/Images/RBT Logo.jpeg" alt="" className="w-3/4 max-w-md grayscale" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img src="/Images/RBT Logo.jpeg" alt="RBT Logo" className="w-14 h-14 rounded-xl shadow-sm" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">RBT MISSION LEARNING</h1>
              <p className="text-xs font-medium text-slate-500">Mission Hai Toh Perfect Learning Chahiye</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-green-600 tracking-widest">INVOICE</h2>
            <p className="text-sm font-mono text-slate-500 mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 py-8">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Billed To</h3>
            <p className="text-base font-bold text-slate-900">{invoice.studentName}</p>
            {invoice.studentEmail && <p className="text-sm text-slate-500 mt-1">{invoice.studentEmail}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Date & Time</h3>
            <p className="text-sm font-medium text-slate-900">{invoice.date}</p>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="py-3 text-xs font-bold tracking-widest text-slate-400 uppercase">Description</th>
                <th className="py-3 text-xs font-bold tracking-widest text-slate-400 uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-4">
                  <p className="text-sm font-bold text-slate-900">{invoice.videoTitle || invoice.courseTitle || invoice.courseName || 'Course Enrollment'}</p>
                  {invoice.videoSubject && <p className="text-xs text-slate-500 mt-1">{invoice.videoSubject}</p>}
                  {invoice.description && <p className="text-xs text-slate-500 mt-1">{invoice.description}</p>}
                </td>
                <td className="py-4 text-right text-sm font-bold text-slate-900">{formatCurrency(invoice.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="py-4 text-sm font-bold text-slate-900 text-right pr-4">Total Amount</td>
                <td className="py-4 text-right text-lg font-black text-green-600">{formatCurrency(invoice.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Info */}
        <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
          <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Payment Details</h3>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-slate-500">Method</div>
            <div className="text-slate-900 font-medium text-right">{invoice.paymentMethod || 'UPI / Google Pay'}</div>
            
            {invoice.upiId && (
              <>
                <div className="text-slate-500">UPI ID</div>
                <div className="text-slate-900 font-medium text-right">{invoice.upiId}</div>
              </>
            )}
            
            <div className="text-slate-500">Transaction ID</div>
            <div className="text-slate-900 font-mono text-xs text-right break-all">{invoice.transactionId}</div>
            
            <div className="text-slate-500">Status</div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-400">
          Thank you for learning with RBT Mission Learning!
        </p>

        {/* Actions (Hidden on Print) */}
        <div className="mt-8 flex gap-3 print:hidden">
          <button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer">
            Download / Print PDF
          </button>
          {onClose && (
            <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
