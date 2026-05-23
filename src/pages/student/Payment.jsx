import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { addDocument, getCollection } from '../../lib/firebaseHelpers'
import { generateInvoiceNumber } from '../../lib/invoice'
import { openRazorpayClient } from '../../lib/razorpayClient'
import UPIPayment from '../../components/UPIPayment'
import InvoiceView from '../../components/InvoiceView'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

export default function Payment() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const video = location.state?.video
  const [invoice, setInvoice] = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [method, setMethod] = useState('razorpay') // 'razorpay' | 'upi'
  const [processing, setProcessing] = useState(false)

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">No video selected for purchase</p>
        <button onClick={() => navigate('/student/videos')} className="btn-primary">
          Go to Videos
        </button>
      </div>
    )
  }

  const payViaRazorpay = () => {
    if (processing) return;
    setProcessing(true);
    openRazorpayClient({
      amount: video.price,
      name: video.title,
      description: `${video.subject} · ${video.class}`,
      user,
      onSuccess: async ({ paymentId, orderId }) => {
        try {
          const invoiceNum = generateInvoiceNumber(paymentId);
          const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          await addDocument('payments', {
            videoId: video.id,
            videoTitle: video.title,
            amount: Number(video.price),
            studentId: user?.studentId || user?.id || '',
            studentName: user?.name || 'Student',
            studentEmail: user?.email || '',
            invoiceNumber: invoiceNum,
            paidAt,
            method: 'razorpay',
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId || null,
            status: 'verified', // Razorpay confirmed at gateway; admin can audit
          });
          setInvoice({
            invoiceNumber: invoiceNum, date: paidAt,
            studentName: user?.name || 'Student', studentEmail: user?.email || '',
            videoTitle: video.title, videoSubject: video.subject || '',
            amount: video.price, transactionId: paymentId,
            upiId: 'razorpay', status: 'Paid',
          });
          setShowInvoice(true);
          toast.success('Payment successful!');
        } catch (err) {
          toast.error('Payment received but record failed. Contact support with ID ' + paymentId);
          console.error(err);
        } finally { setProcessing(false); }
      },
      onFailure: (err) => {
        if (err?.message !== 'Payment cancelled') toast.error(err?.message || 'Payment failed');
        setProcessing(false);
      },
    });
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const invoiceNum = generateInvoiceNumber(paymentData.gpayTransactionId || Date.now().toString())

      const paidAt = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })

      await addDocument('payments', {
        ...paymentData,
        invoiceNumber: invoiceNum,
        paidAt,
        studentEmail: user?.email || '',
      })

      setInvoice({
        invoiceNumber: invoiceNum,
        date: paidAt,
        studentName: paymentData.studentName,
        studentEmail: user?.email || '',
        videoTitle: paymentData.videoTitle,
        videoSubject: video.subject || '',
        amount: paymentData.amount,
        transactionId: paymentData.gpayTransactionId,
        upiId: import.meta.env.VITE_UPI_ID || 'rbtmission@upi',
        status: 'Pending Verification',
      })
      setShowInvoice(true)
    } catch (err) {
      console.error('Payment save failed:', err)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Complete Payment</h1>
        <p className="text-slate-400 text-sm">Pay to unlock: <span className="text-white font-semibold">{video.title}</span></p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Info */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-white mb-4">Video Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-green-brand/10 flex items-center justify-center text-green-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{video.title}</h4>
                <p className="text-xs text-slate-400">{video.subject} • {video.class} • {video.teacher}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Duration</span>
              <span className="text-white font-medium">{video.duration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subject</span>
              <span className="text-white font-medium">{video.subject}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <div className="flex gap-2 mb-4 bg-black/30 p-1 rounded-lg">
            <button onClick={() => setMethod('razorpay')} className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${method === 'razorpay' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>
              💳 Cards / UPI / Wallets
            </button>
            <button onClick={() => setMethod('upi')} className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${method === 'upi' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>
              📱 Manual UPI
            </button>
          </div>

          {method === 'razorpay' ? (
            <div>
              <h3 className="font-bold text-white mb-2">Instant Payment via Razorpay</h3>
              <p className="text-xs text-slate-400 mb-4">Pay instantly with Card, UPI, NetBanking or Wallet. Access unlocks immediately.</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">₹{video.price}</div>
                <div className="text-xs text-slate-400">Total Amount</div>
              </div>
              <button onClick={payViaRazorpay} disabled={processing}
                className="w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {processing ? 'Opening...' : `Pay ₹${video.price} Securely`}
              </button>
              <p className="text-[10px] text-slate-500 mt-2 text-center">Secured by Razorpay · 256-bit SSL</p>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-white mb-4">Pay with UPI (Manual)</h3>
              <UPIPayment
                amount={video.price}
                videoTitle={video.title}
                videoId={video.id}
                studentId={user?.studentId || user?.id}
                studentName={user?.name || 'Student'}
                onPaymentSubmit={handlePaymentSubmit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal isOpen={showInvoice} onClose={() => setShowInvoice(false)} title="Invoice">
        <InvoiceView invoice={invoice} onClose={() => setShowInvoice(false)} />
      </Modal>
    </div>
  )
}
