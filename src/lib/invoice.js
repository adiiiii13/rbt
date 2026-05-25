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

export function formatDateTime(dateString) {
  if (!dateString || dateString === '—') return '—';
  try {
    let d;
    if (typeof dateString?.toDate === 'function') {
      d = dateString.toDate();
    } else if (dateString?.seconds) {
      d = new Date(dateString.seconds * 1000);
    } else {
      d = new Date(dateString);
    }
    if (isNaN(d.getTime())) return String(dateString === '[object Object]' ? '' : dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateString);
  }
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
