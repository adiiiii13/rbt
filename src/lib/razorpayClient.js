// Client-only Razorpay checkout — no Cloud Functions needed.
// Server-side verification SKIPPED (Blaze plan blocked). Admin reconciles manually
// in ManagePayments. Suitable for MVP / low-volume video purchases.

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

// Replace via VITE_RAZORPAY_KEY env if available; fallback to test key
const KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_REPLACE_ME';

export async function openRazorpayClient({ amount, name, description, user, onSuccess, onFailure }) {
  const ok = await loadScript();
  if (!ok) { onFailure?.(new Error('Razorpay SDK failed to load')); return; }
  if (!amount || amount <= 0) { onFailure?.(new Error('Invalid amount')); return; }

  const rzp = new window.Razorpay({
    key: KEY,
    amount: Math.round(amount * 100),
    currency: 'INR',
    name: 'RBT Mission Learning',
    description: description || 'Purchase',
    image: '/favicon.svg',
    prefill: {
      name: user?.name || user?.displayName || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: '#10b981' },
    notes: { item: name || '', studentEmail: user?.email || '' },
    handler: (response) => {
      onSuccess?.({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id || null,
        signature: response.razorpay_signature || null,
      });
    },
    modal: {
      ondismiss: () => onFailure?.(new Error('Payment cancelled')),
    },
  });
  rzp.open();
}
