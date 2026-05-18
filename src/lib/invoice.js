export function generateInvoiceNumber(count) {
  return `RBT-INV-${String(count + 1).padStart(4, '0')}`
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function createInvoiceData(payment) {
  return {
    invoiceNumber: payment.invoiceNumber,
    date: payment.paidAt || new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }),
    studentName: payment.studentName,
    studentEmail: payment.studentEmail || '',
    videoTitle: payment.videoTitle,
    videoSubject: payment.videoSubject || '',
    amount: payment.amount,
    transactionId: payment.gpayTransactionId,
    upiId: import.meta.env.VITE_UPI_ID || 'rbtmission@upi',
    status: 'Paid',
  }
}
