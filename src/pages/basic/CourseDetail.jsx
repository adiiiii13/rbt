import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { openCheckout } from '../../lib/razorpay';
import HlsPlayer from '../../components/HlsPlayer';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function BasicCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, upgradeToBatch } = useAuth();
  
  const backLink = location.pathname.startsWith('/student') ? '/student/basic-courses' : '/basic/courses';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentItem, setCurrentItem] = useState(0);
  const [buying, setBuying] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load course + check enrollment
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', id));
        if (!alive) return;
        if (!snap.exists()) { toast.error('Course not found'); navigate('/basic/courses'); return; }
        const data = { id: snap.id, ...snap.data() };
        setCourse(data);
        if (data.variants?.length) setSelectedVariant(data.variants[0]);

        if (user) {
          const q = query(
            collection(db, 'enrollments'),
            where('uid', '==', user.uid),
            where('courseId', '==', id),
          );
          const enrolSnap = await getDocs(q);
          const validEnrollment = enrolSnap.docs.map(d => ({id: d.id, ...d.data()})).find(e => {
            if (e.status === 'revoked') return false;
            if (!e.enrolledAt || !e.months) return true;
            const enrolledDate = e.enrolledAt.toDate ? e.enrolledAt.toDate() : new Date(e.enrolledAt);
            if (e.months >= 1200) return true; // Lifetime
            const expiryMs = enrolledDate.getTime() + (e.months * 30 * 24 * 60 * 60 * 1000);
            return new Date().getTime() <= expiryMs;
          });
          if (validEnrollment) setEnrollment(validEnrollment);
        }
      } catch (err) { toast.error(err.message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id, user, navigate]);

  const { modules, flatItems } = useMemo(() => {
    if (!course) return { modules: [], flatItems: [] }
    let mods = course.modules || []
    
    // Backwards compatibility
    if (mods.length === 0 && course.lessons?.length > 0) {
      mods = [{
        id: 'legacy_module',
        title: 'Course Content',
        items: [...course.lessons].sort((a,b) => (a.order||0)-(b.order||0)).map(l => ({
          ...l, type: 'video', data: l.videoUrl
        }))
      }]
    }

    const sortedMods = [...mods].sort((a,b) => (a.order||0)-(b.order||0))
    const flat = []
    
    sortedMods.forEach((m, mIdx) => {
      if (m.items) {
        m.items.sort((a,b) => (a.order||0)-(b.order||0)).forEach((itm, iIdx) => {
          flat.push({ ...itm, moduleTitle: m.title, moduleIndex: mIdx, itemIndex: iIdx })
        })
      }
    })
    
    return { modules: sortedMods, flatItems: flat }
  }, [course])

  const handleBuy = async () => {
    if (!user) { toast.error('Please login first'); navigate('/student-login'); return; }

    if (course.courseType === 'batch' && !user.batch && user.batchStatus !== 'pending') {
      setShowUpgradeModal(true);
      return;
    } else if (course.courseType === 'batch' && user.batchStatus === 'pending') {
      toast.error('Your batch upgrade request is pending admin approval.');
      return;
    }
    
    const variant = selectedVariant || { months: 12, price: 0 }
    const isFree = variant.price === 0 || course.isFree

    if (!isFree && !selectedVariant) { toast.error('Select a plan'); return; }
    
    setBuying(true);

    let courseMonths = variant.months;
    if (isFree && !selectedVariant && course.duration) {
      if (course.duration === 'Lifetime') {
        courseMonths = 1200; // 100 years
      } else {
        const parts = course.duration.split(' ');
        if (parts.length === 2) {
          const val = parseFloat(parts[0]) || 12;
          if (parts[1] === 'Days') courseMonths = val / 30;
          else if (parts[1] === 'Months') courseMonths = val;
          else if (parts[1] === 'Years') courseMonths = val * 12;
        }
      }
    }

    if (isFree) {
      try {
        const { addDoc, serverTimestamp } = await import('firebase/firestore')
        const { generateInvoiceNumber } = await import('../../lib/invoice')
        
        // Create enrollment
        const enrolRef = await addDoc(collection(db, 'enrollments'), {
          uid: user.uid,
          courseId: course.id,
          courseName: course.title,
          months: courseMonths,
          amount: variant.price,
          status: 'active',
          enrolledAt: serverTimestamp(),
          studentName: user.name || '',
          studentEmail: user.email || '',
        })

        // Auto-create invoice
        const invoiceNum = generateInvoiceNumber(enrolRef.id)
        const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

        await addDoc(collection(db, 'invoices'), {
          invoiceNumber: invoiceNum,
          studentUid: user.uid,
          studentName: user.name || '',
          studentEmail: user.email || '',
          courseName: course.title,
          description: course.duration === 'Lifetime' ? 'Lifetime Access (Free)' : `${course.duration || '12 Months'} plan (Free)`,
          amount: variant.price,
          status: 'paid',
          paidAt: paidAt,
          issuedDate: paidAt,
          createdAt: serverTimestamp(),
        })

        setEnrollment({ id: enrolRef.id, uid: user.uid, courseId: course.id, months: courseMonths, amount: variant.price })
        toast.success('🎉 Enrolled successfully! Start learning now.')
      } catch (err) { toast.error(err.message) }
      finally { setBuying(false) }
      return
    }

    openCheckout({
      amount: selectedVariant.price,
      courseId: course.id,
      courseTitle: course.title,
      name: 'RBT Mission Learning',
      description: `${course.title} — ${selectedVariant.months}-Month Plan`,
      variantMonths: selectedVariant.months,
      variantPrice: selectedVariant.price,
      user,
      onSuccess: (result) => {
        setEnrollment({
          id: result.enrollmentId,
          uid: user.uid,
          courseId: course.id,
          paymentId: result.paymentId,
        });
        toast.success('🎉 Enrolled successfully! Start learning now.');
        setBuying(false);
      },
      onFailure: (err) => {
        toast.error(err.message || 'Payment failed');
        setBuying(false);
      },
    });
  };

  const handleConfirmUpgrade = async () => {
    setBuying(true);
    const res = await upgradeToBatch();
    setBuying(false);
    if (res.success) {
      toast.success('Upgrade requested! Waiting for admin approval.');
      setShowUpgradeModal(false);
      navigate('/student-initialization');
    } else {
      toast.error(res.message);
    }
  };

  // ─── Loading ───
  if (loading) return (
    <div className="animate-pulse">
      <div className="h-4 bg-white/5 rounded w-32 mb-6" />
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <Skeleton className="w-full aspect-video rounded-2xl mb-6" />
          <Skeleton className="w-3/4 h-10 mb-3" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-24 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-2/3 h-4 mb-6" />
        </div>
        <aside>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <Skeleton className="w-1/2 h-6 mb-4" />
            <Skeleton className="w-full h-24 rounded-xl mb-3" />
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );

  if (!course) return null;

  // ─── Enrolled: show player ───
  if (enrollment) {
    const item = flatItems[currentItem];
    
    const renderItemContent = (item) => {
      if (!item) return null;
      if (item.type === 'video') {
        return (
          <div className="bg-black rounded-2xl overflow-hidden mb-4">
            <HlsPlayer key={item.id} url={item.data} watermark={user?.email || 'RBT'}
              onEnded={() => currentItem < flatItems.length - 1 && setCurrentItem(currentItem + 1)} />
          </div>
        )
      }
      if (item.type === 'pdf') {
        return (
          <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">PDF Document</h2>
            <p className="text-slate-400 mb-6">Click below to view or download this document.</p>
            <a href={item.data} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">Open PDF</a>
          </div>
        )
      }
      if (item.type === 'link') {
        return (
          <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10 text-center">
            <div className="w-16 h-16 bg-purple-500/20 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">External Link</h2>
            <a href={item.data} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors">Visit Link</a>
          </div>
        )
      }
      if (item.type === 'text') {
        return (
          <div className="bg-white/5 rounded-2xl p-8 mb-4 border border-white/10 prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-300">{item.data}</div>
          </div>
        )
      }
      return null
    }

    if (flatItems.length === 0) {
      return (
        <div>
          <Link to={backLink} className="text-slate-400 hover:text-white text-sm mb-4 inline-block no-underline">← Back to Courses</Link>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mt-6">
            <h2 className="text-2xl font-bold text-white mb-2">You are enrolled! 🎉</h2>
            <p className="text-slate-400">Content for this course will be uploaded soon. Check back later.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Link to={backLink} className="text-slate-400 hover:text-white text-sm mb-4 inline-block no-underline">← Back to Courses</Link>
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {item ? (
              <>
                {renderItemContent(item)}
                <h1 className="text-2xl font-bold text-white mb-1">{item.title}</h1>
                <p className="text-sm text-slate-400">Part {currentItem + 1} of {flatItems.length} • {item.moduleTitle}</p>
                {item.description && <p className="text-slate-300 mt-3">{item.description}</p>}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCurrentItem(c => Math.max(0, c - 1))}
                    disabled={currentItem === 0}
                    className="px-5 py-2.5 rounded-lg bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentItem(c => Math.min(flatItems.length - 1, c + 1))}
                    disabled={currentItem === flatItems.length - 1}
                    className="px-5 py-2.5 rounded-lg bg-green-brand hover:bg-green-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </>
            ) : <p className="text-slate-500 text-center py-12">No content available.</p>}
          </div>

          <aside className="bg-white/5 border border-white/10 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
            <h3 className="text-white font-bold mb-3">Course Content</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {modules.map((m, mIdx) => (
                <div key={m.id}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{mIdx + 1}. {m.title}</h4>
                  <div className="space-y-1">
                    {m.items.map((itm) => {
                      const globalIdx = flatItems.findIndex(x => x.id === itm.id);
                      const isActive = globalIdx === currentItem;
                      return (
                        <button
                          key={itm.id}
                          onClick={() => setCurrentItem(globalIdx)}
                          className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer ${
                            isActive
                              ? 'bg-green-brand/20 border border-green-brand text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 opacity-60">
                              {itm.type === 'video' ? '▶' : itm.type === 'pdf' ? '📄' : itm.type === 'text' ? '📝' : '🔗'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium leading-snug">{itm.title}</div>
                              {itm.duration && <div className="text-xs text-slate-500 mt-0.5">{itm.duration}</div>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ─── Not enrolled: show landing + buy ───
  return (
    <div>
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 w-full max-w-md text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Batch Course</h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10">
              You are a Basic User trying to buy/enroll in a Batch Course. Please upgrade your account to a Batch Student first.
            </p>
            <div className="flex gap-3 relative z-10">
              <button onClick={() => setShowUpgradeModal(false)} disabled={buying} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirmUpgrade} disabled={buying} className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-medium cursor-pointer">
                {buying ? 'Upgrading...' : 'Upgrade Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link to={backLink} className="text-slate-400 hover:text-white text-sm mb-6 inline-block no-underline">← Back to Courses</Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="w-full rounded-2xl mb-6" />}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{course.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {course.level && <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{course.level}</span>}
            {course.duration && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">{course.duration}</span>}
            {flatItems.length > 0 && <span className="text-xs bg-green-brand/20 text-green-brand px-3 py-1 rounded-full">{flatItems.length} Content Items</span>}
            {course.isFree && <span className="text-xs bg-green-brand/20 text-green-brand px-3 py-1 rounded-full">Free Course</span>}
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">{course.description}</p>

          {course.subjects?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-2">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {course.subjects.map(s => (
                  <span key={s} className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {modules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3">Course Curriculum</h3>
              <div className="space-y-4">
                {modules.map((m, mIdx) => (
                  <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-black/20 p-3 border-b border-white/10">
                      <h4 className="text-sm font-bold text-white">Module {mIdx + 1}: {m.title}</h4>
                      {m.description && <p className="text-xs text-slate-400 mt-1">{m.description}</p>}
                    </div>
                    <div className="divide-y divide-white/5">
                      {m.items.map((itm, iIdx) => (
                        <div key={itm.id} className="p-3 flex items-center gap-3">
                          <span className="opacity-50 text-xs">
                            {itm.type === 'video' ? '▶' : itm.type === 'pdf' ? '📄' : itm.type === 'text' ? '📝' : '🔗'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium">{itm.title}</div>
                            {itm.duration && <div className="text-xs text-slate-500">{itm.duration}</div>}
                          </div>
                          {itm.isFree ? (
                            <span className="text-[10px] bg-green-brand/20 text-green-brand px-2 py-0.5 rounded font-bold uppercase">Free Preview</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buy panel */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">{course.isFree ? 'Get Free Access' : 'Choose Your Plan'}</h3>

            {!course.isFree && course.variants?.length > 0 ? (
              <div className="space-y-3 mb-6">
                {course.variants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(v)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedVariant?.months === v.months
                        ? 'bg-green-brand/15 border-green-brand'
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-bold">{v.months}-Month Access</span>
                      {v.discount && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{v.discount}</span>}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">₹{v.price}</span>
                      {v.originalPrice && v.originalPrice > v.price && (
                        <span className="text-sm text-slate-500 line-through">₹{v.originalPrice}</span>
                      )}
                    </div>
                    {v.note && <p className="text-xs text-slate-400 mt-1">{v.note}</p>}
                  </button>
                ))}
              </div>
            ) : course.isFree ? (
              <p className="text-green-brand text-sm mb-4">This course is free! Enroll to start learning.</p>
            ) : (
              <p className="text-slate-400 text-sm mb-4">No plans configured yet.</p>
            )}

            <button
              onClick={handleBuy}
              disabled={(!course.isFree && !selectedVariant) || buying || (course.courseType === 'batch' && user?.batchStatus === 'pending')}
              className="w-full bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {buying ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4" strokeLinecap="round" /></svg>
                  Processing...
                </>
              ) : course.courseType === 'batch' && !user?.batch ? (
                user?.batchStatus === 'pending' ? 'Upgrade Pending Approval' : 'Upgrade to Batch Access'
              ) : course.isFree ? (
                'Free, enroll now'
              ) : selectedVariant ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Pay ₹{selectedVariant.price} with Razorpay
                </>
              ) : 'Select a plan'}
            </button>

            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">✓ Secure payment via Razorpay</div>
              <div className="flex items-center gap-2">✓ Instant access after payment</div>
              <div className="flex items-center gap-2">✓ Sequential video access</div>
              <div className="flex items-center gap-2">✓ Secure stream — no download</div>
            </div>

            {/* Razorpay badge */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Secured by Razorpay
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
}
