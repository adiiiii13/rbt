// Razorpay stub — replace with real keys later.
// Loads Razorpay checkout.js dynamically. Falls back to mock flow if no key.

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

// Opens Razorpay checkout. If no key set, runs mock flow (auto-success after 1s).
// opts: { amount, currency='INR', name, description, courseId, variant, user, onSuccess(paymentId), onFailure(err) }
export async function openCheckout(opts) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const { amount, name, description, user, onSuccess, onFailure } = opts;

  if (!key) {
    // Mock mode — show confirm + fake success
    console.warn('[razorpay] VITE_RAZORPAY_KEY_ID not set — running mock flow');
    const proceed = confirm(`STUB PAYMENT\n\n${name}\n${description}\nAmount: ₹${amount}\n\nProceed (simulate success)?`);
    if (proceed) {
      const fakeId = 'mock_pay_' + Date.now();
      setTimeout(() => onSuccess?.(fakeId), 600);
    } else {
      onFailure?.(new Error('Cancelled by user'));
    }
    return;
  }

  const ok = await loadScript();
  if (!ok) { onFailure?.(new Error('Razorpay SDK load failed')); return; }

  // NOTE: in production, create order server-side and pass order_id here.
  const rzp = new window.Razorpay({
    key,
    amount: amount * 100, // paise
    currency: opts.currency || 'INR',
    name,
    description,
    prefill: {
      name: user?.name || user?.displayName || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: '#10b981' },
    handler: (response) => onSuccess?.(response.razorpay_payment_id),
    modal: { ondismiss: () => onFailure?.(new Error('Dismissed')) },
  });
  rzp.open();
}
