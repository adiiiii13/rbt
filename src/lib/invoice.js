export function generateInvoiceNumber(countOrId) {
  if (typeof countOrId === 'string') {
    return `RBT-INV-${countOrId.slice(0, 8).toUpperCase()}`
  }
  return `RBT-INV-${String(countOrId + 1).padStart(4, '0')}`
}

export function formatCurrency(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(num)
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
