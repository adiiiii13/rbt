import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { addDocument, getCollection } from '../../lib/firebaseHelpers'
import { generateInvoiceNumber } from '../../lib/invoice'
import UPIPayment from '../../components/UPIPayment'
import InvoiceView from '../../components/InvoiceView'
import Modal from '../../components/Modal'

export default function Payment() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const video = location.state?.video
  const [invoice, setInvoice] = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)

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

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const existingPayments = await getCollection('payments')
      const invoiceNum = generateInvoiceNumber(existingPayments.length)

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
        <h1 className="text-2xl font-bold text-navy mb-1">Complete Payment</h1>
        <p className="text-slate-500 text-sm">Pay to unlock: <span className="text-navy font-semibold">{video.title}</span></p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-navy mb-4">Video Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-green-brand/10 flex items-center justify-center text-green-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </div>
              <div>
                <h4 className="font-semibold text-navy text-sm">{video.title}</h4>
                <p className="text-xs text-slate-500">{video.subject} • {video.class} • {video.teacher}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Duration</span>
              <span className="text-navy font-medium">{video.duration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subject</span>
              <span className="text-navy font-medium">{video.subject}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-white mb-4">Pay with UPI</h3>
          <UPIPayment
            amount={video.price}
            videoTitle={video.title}
            videoId={video.id}
            studentId={user?.studentId || user?.id}
            studentName={user?.name || 'Student'}
            onPaymentSubmit={handlePaymentSubmit}
          />
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal isOpen={showInvoice} onClose={() => setShowInvoice(false)} title="Invoice">
        <InvoiceView invoice={invoice} onClose={() => setShowInvoice(false)} />
      </Modal>
    </div>
  )
}
