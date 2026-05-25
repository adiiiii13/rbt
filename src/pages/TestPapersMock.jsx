import { GridSkeleton } from '../components/ui/Skeleton';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useRealtimeCollection } from '../lib/useRealtimeCollection';
import { useAuth } from '../context/AuthContext';
import { openCheckout } from '../lib/razorpay';
import { sendCoursePaymentSuccessEmail } from '../lib/emailUtils';
import { addDocument } from '../lib/firebaseHelpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileTextIcon, ClockIcon } from '../components/Icons';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'jee-main', label: 'JEE Main', color: '#3b82f6' },
  { id: 'neet', label: 'NEET', color: '#10b981' },
  { id: 'class-8', label: 'Class 8', color: '#f59e0b' },
  { id: 'class-9', label: 'Class 9', color: '#f59e0b' },
  { id: 'class-10', label: 'Class 10', color: '#f59e0b' },
  { id: 'class-11', label: 'Class 11', color: '#a855f7' },
  { id: 'class-12', label: 'Class 12', color: '#a855f7' },
  { id: 'boards', label: 'Boards', color: '#ef4444' },
];

export default function TestPapersMock() {
  const location = useLocation();
  const { user } = useAuth();
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');
  const backTo = isDashboard ? location.pathname.replace(/\/mock\/?$/, '') : '/test-papers';
  const basePath = location.pathname.replace(/\/?$/, '');

  const { data: tests, loading: testsLoading } = useRealtimeCollection('mockTests', { fallback: [] });
  const { data: series, loading: seriesLoading } = useRealtimeCollection('testSeries', { fallback: [] });
  
  const [selectedCat, setSelectedCat] = useState('all');
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'series'
  
  const [testAccessSet, setTestAccessSet] = useState(new Set());
  const [seriesAccessSet, setSeriesAccessSet] = useState(new Set());
  const [courseAccessSet, setCourseAccessSet] = useState(new Set());
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [payingId, setPayingId] = useState(null);

  // Load access for current user
  useEffect(() => {
    if (!user?.uid) { setLoadingAccess(false); return; }
    (async () => {
      try {
        const [testSnap, seriesSnap, courseSnap] = await Promise.all([
          getDocs(query(collection(db, 'mockTestAccess'), where('uid', '==', user.uid))),
          getDocs(query(collection(db, 'testSeriesAccess'), where('uid', '==', user.uid))),
          getDocs(query(collection(db, 'courseAccess'), where('uid', '==', user.uid)))
        ]);
        setTestAccessSet(new Set(testSnap.docs.map(d => d.data().testId)));
        setSeriesAccessSet(new Set(seriesSnap.docs.map(d => d.data().seriesId)));
        setCourseAccessSet(new Set(courseSnap.docs.map(d => d.data().courseId)));
      } catch {}
      setLoadingAccess(false);
    })();
  }, [user?.uid]);

  const userCourseIds = Array.from(courseAccessSet);
  const hasCourseAccess = (item) => {
    if (!item.visibilityCourseIds || !Array.isArray(item.visibilityCourseIds)) return false;
    return item.visibilityCourseIds.some(cid => userCourseIds.includes(cid));
  };

  const handlePayTest = (test) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }
    setPayingId(test.id);
    openCheckout({
      amount: test.price,
      courseId: `mockTest_${test.id}`,
      courseTitle: test.title,
      variantLabel: 'Mock Test Access',
      variantMonths: 0,
      variantPrice: test.price,
      user,
      onSuccess: async (result) => {
        try {
          await addDocument('mockTestAccess', {
            uid: user.uid,
            testId: test.id,
            testTitle: test.title,
            status: 'active',
            enrolledAt: new Date().toISOString(),
            paymentType: 'razorpay',
            studentName: user.name || '',
            studentEmail: user.email || '',
          });
          setTestAccessSet(prev => new Set([...prev, test.id]));
          try {
            await sendCoursePaymentSuccessEmail(user.name, user.email, test.title, test.price, result.paymentId)
          } catch(e) { console.error('Failed to send success email', e) }
          toast.success(`Unlocked: ${test.title}`);
        } catch (err) {
          toast.error(err.message);
        }
        setPayingId(null);
      },
      onFailure: () => setPayingId(null),
    });
  };

  const handlePaySeries = (s) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }
    setPayingId(s.id);
    openCheckout({
      amount: s.price,
      courseId: `testSeries_${s.id}`,
      courseTitle: s.title,
      variantLabel: 'Test Series Access',
      variantMonths: 0,
      variantPrice: s.price,
      user,
      onSuccess: async (result) => {
        try {
          await addDocument('testSeriesAccess', {
            uid: user.uid,
            seriesId: s.id,
            seriesTitle: s.title,
            status: 'active',
            enrolledAt: new Date().toISOString(),
            paymentType: 'razorpay',
            studentName: user.name || '',
            studentEmail: user.email || '',
          });
          setSeriesAccessSet(prev => new Set([...prev, s.id]));
          try {
            await sendCoursePaymentSuccessEmail(user.name, user.email, s.title, s.price, result.paymentId)
          } catch(e) { console.error('Failed to send success email', e) }
          toast.success(`Unlocked: ${s.title}`);
        } catch (err) {
          toast.error(err.message);
        }
        setPayingId(null);
      },
      onFailure: () => setPayingId(null),
    });
  };

  const nowStr = new Date().toISOString().split('T')[0];

  const validTests = tests.filter(t => {
    if (t.visibility === 'course' || t.visibility === 'batch') return false;
    if (t.expiryType === 'date' && t.expiryDate && t.expiryDate < nowStr) return false;
    return true;
  });

  const validSeries = series.filter(s => {
    if (s.visibility === 'course' || s.visibility === 'batch') return false;
    if (s.expiryType === 'date' && s.expiryDate && s.expiryDate < nowStr) return false;
    return true;
  });

  const filteredTests = selectedCat === 'all' ? validTests : validTests.filter(t => t.category === selectedCat);
  const filteredSeries = selectedCat === 'all' ? validSeries : validSeries.filter(s => s.category === selectedCat);

  return (
    <div className={`${isDashboard ? 'bg-[#0a0a0a]' : 'bg-black'} pb-16 min-h-screen relative`}>
      <div className={`container-main max-w-7xl relative z-10 ${isDashboard ? 'pt-0' : 'pt-32'}`}>
        <Link to={backTo} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 no-underline text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Test Papers
        </Link>

        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Buy Test Series / Papers</h1>
            <p className="text-slate-400">Unlock individual mock tests or complete test series.</p>
          </div>
          
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('series')} 
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'series' ? 'bg-green-brand text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Test Series
            </button>
            <button 
              onClick={() => setActiveTab('tests')} 
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'tests' ? 'bg-green-brand text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Individual Tests
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedCat === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedCat === c.id
                    ? 'text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
                style={selectedCat === c.id ? { backgroundColor: c.color } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'series' && (
          <>
            {seriesLoading ? <GridSkeleton count={3} type="card" /> : filteredSeries.length === 0 ? (
              <div className="text-center py-16">
                <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No test series available in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSeries.map((s, idx) => {
                  const cat = CATEGORIES.find(c => c.id === s.category) || { label: s.category, color: '#6366f1' };
                  const isPaid = s.price > 0;
                  const hasAccess = !isPaid || seriesAccessSet.has(s.id) || hasCourseAccess(s);
                  const isPaying = payingId === s.id;

                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                    >
                      <div className="h-2" style={{ background: cat.color }} />
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>
                            {cat.label}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasAccess ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {hasAccess ? 'Unlocked' : (isPaid ? `₹${s.price}` : 'Free')}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{s.description}</p>
                        
                        <div className="bg-black/30 rounded-lg p-3 text-center mb-6">
                          <div className="text-2xl font-bold text-white">{s.testIds?.length || 0}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Tests Included</div>
                        </div>

                        {hasAccess ? (
                          <Link to="/student/my-tests" className="mt-auto w-full bg-green-brand/20 hover:bg-green-brand/30 text-green-400 font-bold py-3 px-4 rounded-xl text-center transition-all border border-green-brand/30">
                            View in My Tests
                          </Link>
                        ) : (
                          <button onClick={() => handlePaySeries(s)} disabled={payingId === s.id || !user}
                            className="mt-auto w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                            {payingId === s.id ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4" strokeLinecap="round" /></svg>
                                Processing...
                              </>
                            ) : `Pay ₹${s.price} to Unlock Series`}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'tests' && (
          <>
            {testsLoading ? <GridSkeleton count={6} type="card" /> : filteredTests.length === 0 ? (
              <div className="text-center py-16">
                <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No mock tests available in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test, idx) => {
                  const cat = CATEGORIES.find(c => c.id === test.category) || { label: test.category, color: '#6366f1' };
                  const isPaid = test.price > 0;
                  
                  // Check if they have direct access OR series access
                  let hasSeriesAccess = false;
                  if (series && series.length > 0) {
                    for (const s of series) {
                      if ((seriesAccessSet.has(s.id) || hasCourseAccess(s)) && s.testIds?.includes(test.id)) {
                        hasSeriesAccess = true;
                        break;
                      }
                    }
                  }
                  const hasAccess = !isPaid || testAccessSet.has(test.id) || hasCourseAccess(test) || hasSeriesAccess;
                  const isPaying = payingId === test.id;

                  return (
                    <motion.div key={test.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden flex flex-col"
                    >
                      <div className="h-2" style={{ background: cat.color }} />
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>
                            {cat.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasAccess ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {hasAccess ? 'Unlocked' : (isPaid ? `₹${test.price}` : 'Free')}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{test.title}</h3>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{test.description}</p>

                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="bg-white/5 rounded-lg p-2">
                            <div className="text-white font-bold">{test.questions?.length || test.totalQuestions || 0}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Questions</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <div className="text-white font-bold">{test.duration || 30}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Mins</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <div className="text-white font-bold">{test.maxMarks || (test.questions?.length || 0) * 4}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Marks</div>
                          </div>
                        </div>

                        {hasAccess ? (
                          <Link to={`/student/mock/${test.id}`} className="mt-auto w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-2">
                            Start Test
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </Link>
                        ) : (
                          <button onClick={() => handlePayTest(test)} disabled={payingId === test.id || !user}
                            className="mt-auto w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95">
                            {payingId === test.id ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4" strokeLinecap="round" /></svg>
                                Processing...
                              </>
                            ) : `Pay ₹${test.price} to Unlock`}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
