import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency } from '../lib/invoice'

export default function UPIPayment({ amount, videoTitle, videoId, studentId, studentName, onPaymentSubmit }) {
  const [transactionId, setTransactionId] = useState('')
  const [step, setStep] = useState('pay') // pay | verify | done
  const [error, setError] = useState('')

  const upiId = import.meta.env.VITE_UPI_ID || 'rbtmission@upi'
  const upiLink = `upi://pay?pa=${upiId}&pn=RBT%20Mission%20Learning&am=${amount}&cu=INR&tn=Video:%20${encodeURIComponent(videoTitle)}`

  const handleSubmit = () => {
    if (!transactionId.trim()) {
      setError('Enter transaction ID after payment')
      return
    }
    setError('')
    onPaymentSubmit({
      studentId,
      studentName,
      videoId,
      videoTitle,
      amount,
      gpayTransactionId: transactionId.trim(),
      status: 'pending',
    })
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-brand/20 flex items-center justify-center text-green-brand mx-auto text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold text-white">Payment Submitted!</h3>
        <p className="text-slate-400 text-sm">Your invoice is being generated. You'll get access once verified.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="text-center p-4 rounded-xl bg-green-brand/10 border border-green-brand/20">
        <p className="text-sm text-slate-400 mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-green-brand">{formatCurrency(amount)}</p>
      </div>

      {step === 'pay' && (
        <>
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG value={upiLink} size={200} />
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            Scan QR with Google Pay, PhonePe, or any UPI app
          </p>

          {/* Open GPay Button */}
          <a
            href={upiLink}
            className="btn-primary w-full text-center no-underline"
          >
            Open Google Pay
          </a>

          <div className="text-center">
            <button
              onClick={() => setStep('verify')}
              className="text-sm text-green-brand hover:text-green-light underline cursor-pointer"
            >
              I've made the payment →
            </button>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">
              UPI Transaction ID
            </label>
            <input
              className="input-field"
              placeholder="e.g. 2026051612345678"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            <p className="text-xs text-slate-500 mt-1">
              You'll find this in your UPI app's transaction history
            </p>
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">
            Submit & Get Invoice
          </button>

          <button
            onClick={() => setStep('pay')}
            className="text-sm text-slate-400 hover:text-white w-full text-center cursor-pointer"
          >
            ← Back to payment
          </button>
        </>
      )}
    </div>
  )
}
