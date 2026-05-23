import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/invoice';
import { motion } from 'framer-motion';

// Added for invoice payment and view
import { getCollectionWhere, updateDocument, addDocument } from '../../lib/firebaseHelpers';
import { openRazorpayClient } from '../../lib/razorpayClient';
import InvoiceView from '../../components/InvoiceView';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { EyeIcon } from '../../components/Icons';

export default function BasicPayment() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    let alive = true;

    (async () => {
      try {
        // Fetch payments for this user
        const payQ = query(
          collection(db, 'razorpayOrders'),
          where('uid', '==', user.uid),
        );
        const paySnap = await getDocs(payQ);
        const payData = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        payData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // Fetch enrollments for this user
        const enrolQ = query(
          collection(db, 'enrollments'),
          where('uid', '==', user.uid),
        );
        const enrolSnap = await getDocs(enrolQ);
        const enrolData = enrolSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch invoices for this user
        const invsByUid = await getCollectionWhere('invoices', 'studentUid', '==', user.uid);
        const invsByEmail = user.email ? await getCollectionWhere('invoices', 'studentEmail', '==', user.email) : [];
        const invMap = new Map();
        [...invsByUid, ...invsByEmail].forEach(i => invMap.set(i.id, i));
        const invData = Array.from(invMap.values()).sort((a, b) => {
          const aTime = a.issuedDate ? new Date(a.issuedDate).getTime() : 0;
          const bTime = b.issuedDate ? new Date(b.issuedDate).getTime() : 0;
          return bTime - aTime;
        });

        if (alive) {
          setPayments(payData);
          setEnrollments(enrolData);
          setInvoices(invData);
        }
      } catch (err) {
        console.error('[BasicPayment] fetch error:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user]);

  const handlePayInvoice = (r) => {
    openRazorpayClient({
      amount: r.amount,
      name: r.courseName || r.title || 'Invoice Payment',
      description: r.description || 'Invoice Payment',
      user: user,
      onSuccess: async (res) => {
        try {
          await updateDocument('invoices', r.id, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            paymentId: res.paymentId
          });
          await addDocument('payments', {
            type: 'razorpay_invoice',
            studentId: user.studentId || user.id,
            studentUid: user.uid || user.id,
            studentName: user.name,
            studentEmail: user.email,
            invoiceNumber: r.invoiceNumber,
            courseTitle: r.courseName || r.title || 'Invoice Payment',
            amount: r.amount,
            method: 'razorpay',
            paymentId: res.paymentId,
            status: 'verified',
            paidAt: new Date().toISOString()
          });
          toast.success('Payment successful!');
          setInvoices(prev => prev.map(i => i.id === r.id ? { ...i, status: 'paid', paidAt: new Date().toISOString() } : i));
        } catch (e) {
          toast.error('Payment verified but failed to update status.');
        }
      },
      onFailure: (err) => toast.error(err.message || 'Payment failed')
    });
  };

  const openView = (i) => {
    setSelectedInvoice({
      invoiceNumber: i.invoiceNumber, date: i.issuedDate || i.paidAt || '—',
      studentName: i.studentName, studentEmail: i.studentEmail,
      courseTitle: i.courseName, description: i.description,
      amount: i.amount, transactionId: i.id,
      paymentMethod: 'Invoice', status: i.status === 'paid' ? 'Paid' : 'Pending',
    });
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'verified':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full">✓ Paid</span>;
      case 'created':
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">⏳ Pending</span>;
      case 'signature_mismatch':
      case 'failed':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full">✕ Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-500/15 text-slate-400 px-2.5 py-1 rounded-full">{status || 'Unknown'}</span>;
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Payment</h1>
          <p className="text-slate-400 text-sm">Your purchases and enrolled courses</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
              <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-1/2 mb-2" />
              <div className="h-4 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Enrolled Courses */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Enrolled Courses
            </h2>
            {enrollments.length === 0 ? (
              <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">No Enrolled Courses</h3>
                <p className="text-slate-400 text-sm mb-4">Purchase a course to start learning.</p>
                <Link to="/basic/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-green-brand hover:text-green-400 no-underline">
                  Browse Courses →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {enrollments.map((enrol, idx) => (
                  <motion.div
                    key={enrol.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      to={`/basic/courses/${enrol.courseId}`}
                      className="block bg-[#111111] rounded-2xl p-5 border border-slate-800 hover:border-green-brand/30 transition-all no-underline group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-brand/10 flex items-center justify-center text-green-brand">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                        <span className="text-xs font-semibold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full">Active</span>
                      </div>
                      <h3 className="text-white font-bold mb-1 group-hover:text-green-brand transition-colors">{enrol.courseTitle}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{enrol.variant?.months || '—'}mo plan</span>
                        <span>•</span>
                        <span>{formatCurrency(enrol.amount)}</span>
                        {enrol.expiresAt && (
                          <>
                            <span>•</span>
                            <span>Expires {new Date(enrol.expiresAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-green-brand font-semibold group-hover:translate-x-1 transition-transform">
                        Continue Learning →
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>
                Invoices & Dues
              </h2>
              <div className="space-y-3">
                {invoices.map((inv, idx) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-[#111111] rounded-2xl p-5 border border-slate-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold text-sm">{inv.courseName || 'Course Invoice'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">Invoice #{inv.invoiceNumber}</p>
                      </div>
                      {statusBadge(inv.status)}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="font-semibold text-white">{formatCurrency(inv.amount)}</span>
                        <span>{formatDate(inv.issuedDate || inv.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openView(inv)} className="text-sm text-green-brand hover:text-green-light cursor-pointer font-medium inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg">
                          <EyeIcon size={14} /> View
                        </button>
                        {inv.status !== 'paid' && (
                          <button onClick={() => handlePayInvoice(inv)} className="text-sm bg-green-brand hover:bg-green-500 text-black font-bold py-1 px-4 rounded-lg transition-colors cursor-pointer">
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>
              Payment History
            </h2>
            {payments.length === 0 ? (
              <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
                <p className="text-slate-400 text-sm">No payments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((pay, idx) => (
                  <motion.div
                    key={pay.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-[#111111] rounded-2xl p-5 border border-slate-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold text-sm">{pay.courseTitle || 'Course Purchase'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{pay.variantLabel || `${pay.variantMonths || '—'}mo plan`}</p>
                      </div>
                      {statusBadge(pay.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="font-semibold text-white">{formatCurrency(pay.amount)}</span>
                      <span>{formatDate(pay.createdAt)}</span>
                      {pay.orderId && (
                        <span className="font-mono text-[10px] text-slate-500">#{pay.orderId.slice(-8)}</span>
                      )}
                      {pay.paymentId && (
                        <span className="font-mono text-[10px] text-slate-500">
                          Pay: {pay.paymentId.slice(-8)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Invoice" size="lg">
        {selectedInvoice && <InvoiceView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      </Modal>
    </div>
  );
}
