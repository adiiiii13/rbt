// Razorpay integration — server-side order creation + signature verification.
// Flow: createOrder (Cloud Function) → Razorpay Checkout → verifyPayment (Cloud Function)

import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

let scriptLoaded = false;

function loadScript() {
  return new Promise((resolve) => {
    if (scriptLoaded || typeof window === 'undefined') return resolve(true);
    if (window.Razorpay) { scriptLoaded = true; return resolve(true); }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => { scriptLoaded = true; resolve(true); };
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Opens Razorpay checkout with server-side order + verification.
 *
 * @param {object} opts
 * @param {number} opts.amount - Amount in INR (e.g. 4999)
 * @param {string} opts.courseId - Firestore course ID
 * @param {string} opts.courseTitle - Course title for display
 * @param {string} opts.name - Merchant/display name
 * @param {string} opts.description - Plan description
 * @param {number} opts.variantMonths - Plan duration in months
 * @param {number} opts.variantPrice - Plan price
 * @param {object} opts.user - Current user (name, email, phone)
 * @param {function} opts.onSuccess - Called with { paymentId, orderId, enrollmentId }
 * @param {function} opts.onFailure - Called with Error
 */
export async function openCheckout(opts) {
  const {
    amount, courseId, courseTitle, name, description,
    variantMonths, variantPrice, user,
    onSuccess, onFailure,
  } = opts;

  try {
    // 1. Load Razorpay SDK
    const ok = await loadScript();
    if (!ok) { onFailure?.(new Error('Razorpay SDK load failed')); return; }

    // 2. Create server-side order
    const createOrder = httpsCallable(functions, 'createRazorpayOrder');
    const { data: orderData } = await createOrder({
      amount,
      courseId,
      courseTitle: courseTitle || name || '',
      variantLabel: description || '',
    });

    const { orderId, key } = orderData;

    // 3. Open Razorpay Checkout
    const rzp = new window.Razorpay({
      key,
      amount: orderData.amount, // in paise from server
      currency: orderData.currency || 'INR',
      order_id: orderId,
      name: name || 'RBT Mission Learning',
      description: description || 'Course Purchase',
      prefill: {
        name: user?.name || user?.displayName || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: { color: '#10b981' },
      handler: async (response) => {
        try {
          // 4. Verify payment server-side
          const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
          const { data: verifyData } = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            courseId,
            courseTitle: courseTitle || name || '',
            variantMonths: variantMonths || 6,
            variantPrice: variantPrice || amount,
          });

          onSuccess?.({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            enrollmentId: verifyData.enrollmentId,
          });
        } catch (verifyErr) {
          console.error('[razorpay] Verification failed:', verifyErr);
          onFailure?.(new Error('Payment made but verification failed. Contact support.'));
        }
      },
      modal: {
        ondismiss: () => onFailure?.(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  } catch (err) {
    console.error('[razorpay] Checkout error:', err);
    onFailure?.(err);
  }
}

/**
 * Opens Razorpay checkout for Invoices with server-side order + verification.
 *
 * @param {object} opts
 * @param {string} opts.invoiceId - Firestore invoice ID
 * @param {object} opts.user - Current user (name, email, phone)
 * @param {function} opts.onSuccess - Called with { paymentId, orderId }
 * @param {function} opts.onFailure - Called with Error
 */
export async function openInvoiceCheckout(opts) {
  const { invoiceId, user, onSuccess, onFailure } = opts;

  try {
    // 1. Load Razorpay SDK
    const ok = await loadScript();
    if (!ok) { onFailure?.(new Error('Razorpay SDK load failed')); return; }

    // 2. Create server-side order
    const createOrder = httpsCallable(functions, 'createInvoiceRazorpayOrder');
    const { data: orderData } = await createOrder({ invoiceId });

    const { orderId, key, invoice } = orderData;

    // 3. Open Razorpay Checkout
    const rzp = new window.Razorpay({
      key,
      amount: orderData.amount, // in paise from server
      currency: orderData.currency || 'INR',
      order_id: orderId,
      name: 'RBT Mission Learning',
      description: `Invoice Payment: ${invoice.invoiceNumber || 'Payment'}`,
      prefill: {
        name: user?.name || user?.displayName || invoice.studentName || '',
        email: user?.email || invoice.studentEmail || '',
        contact: user?.phone || '',
      },
      theme: { color: '#10b981' },
      handler: async (response) => {
        try {
          // 4. Verify payment server-side
          const verifyPayment = httpsCallable(functions, 'verifyInvoiceRazorpayPayment');
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            invoiceId,
          });

          onSuccess?.({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
          });
        } catch (verifyErr) {
          console.error('[razorpay] Invoice verification failed:', verifyErr);
          onFailure?.(new Error('Payment made but verification failed. Contact support.'));
        }
      },
      modal: {
        ondismiss: () => onFailure?.(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  } catch (err) {
    console.error('[razorpay] Invoice Checkout error:', err);
    onFailure?.(err);
  }
}
