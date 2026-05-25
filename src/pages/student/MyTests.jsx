import { GridSkeleton } from '../../components/ui/Skeleton';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileTextIcon } from '../../components/Icons';

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

export default function MyTests() {
  const { user } = useAuth();
  
  const { data: tests, loading: testsLoading } = useRealtimeCollection('mockTests', { fallback: [] });
  const { data: series, loading: seriesLoading } = useRealtimeCollection('testSeries', { fallback: [] });
  
  const [selectedCat, setSelectedCat] = useState('all');
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'series'
  
  const [testAccessSet, setTestAccessSet] = useState(new Set());
  const [seriesAccessSet, setSeriesAccessSet] = useState(new Set());
  const [courseAccessSet, setCourseAccessSet] = useState(new Set());
  const [loadingAccess, setLoadingAccess] = useState(true);

  // Load mock test access for current user
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

  const nowStr = new Date().toISOString().split('T')[0];
  const isExpired = (item) => item.expiryType === 'date' && item.expiryDate && item.expiryDate < nowStr;

  // Derived accessible data
  const accessibleSeries = series.filter(s => s.price === 0 || seriesAccessSet.has(s.id) || hasCourseAccess(s));
  
  const accessibleTests = tests.filter(t => {
    if (t.price === 0) return true;
    if (testAccessSet.has(t.id)) return true;
    if (hasCourseAccess(t)) return true;
    // Check if test belongs to an accessible series
    return accessibleSeries.some(s => s.testIds?.includes(t.id));
  });

  const filteredTests = selectedCat === 'all' ? accessibleTests : accessibleTests.filter(t => t.category === selectedCat);
  const filteredSeries = selectedCat === 'all' ? accessibleSeries : accessibleSeries.filter(s => s.category === selectedCat);

  return (
    <div className="pb-16 min-h-screen relative">
      <div className="container-main max-w-7xl relative z-10 pt-4">
        
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Tests / Series</h1>
            <p className="text-slate-400">View and take tests you have enrolled in.</p>
          </div>
          
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('series')} 
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'series' ? 'bg-green-brand text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              My Series
            </button>
            <button 
              onClick={() => setActiveTab('tests')} 
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'tests' ? 'bg-green-brand text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              My Tests
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
            {seriesLoading || loadingAccess ? <GridSkeleton count={3} type="card" /> : filteredSeries.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">You don't have access to any test series yet.</p>
                <Link to="/student/test-papers/mock" className="inline-block mt-4 bg-green-brand text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                  Explore Test Series
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSeries.map((s, idx) => {
                  const cat = CATEGORIES.find(c => c.id === s.category) || { label: s.category, color: '#6366f1' };

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
                          <div className="flex gap-2">
                            {hasCourseAccess(s) && !seriesAccessSet.has(s.id) && s.price > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Via Course</span>
                            )}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                              Unlocked
                            </span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{s.description}</p>
                        
                        {s.expiryType === 'date' && s.expiryDate && (
                          <div className="text-[10px] text-amber-400 font-medium mb-3">
                            {isExpired(s) ? 'Expired' : `Expires: ${new Date(s.expiryDate).toLocaleDateString()}`}
                          </div>
                        )}
                        
                        <div className="bg-black/30 rounded-lg p-3 text-center mb-6">
                          <div className="text-2xl font-bold text-white">{s.testIds?.length || 0}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Tests Included</div>
                        </div>

                        <button onClick={() => setActiveTab('tests')} disabled={isExpired(s)} className="mt-auto w-full bg-green-brand/20 hover:bg-green-brand/30 text-green-400 font-bold py-3 px-4 rounded-xl text-center transition-all border border-green-brand/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          {isExpired(s) ? 'Access Expired' : 'View All Tests'}
                        </button>
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
            {testsLoading || loadingAccess ? <GridSkeleton count={6} type="card" /> : filteredTests.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">You don't have access to any mock tests yet.</p>
                <Link to="/student/test-papers/mock" className="inline-block mt-4 bg-green-brand text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                  Explore Mock Tests
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test, idx) => {
                  const cat = CATEGORIES.find(c => c.id === test.category) || { label: test.category, color: '#6366f1' };

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
                          <div className="flex gap-2">
                            {hasCourseAccess(test) && !testAccessSet.has(test.id) && test.price > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Via Course</span>
                            )}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                              Unlocked
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{test.title}</h3>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{test.description}</p>
                        
                        {test.expiryType === 'date' && test.expiryDate && (
                          <div className="text-[10px] text-amber-400 font-medium mb-3">
                            {isExpired(test) ? 'Expired' : `Expires: ${new Date(test.expiryDate).toLocaleDateString()}`}
                          </div>
                        )}

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

                        {isExpired(test) ? (
                          <button disabled className="mt-auto w-full bg-white/5 text-slate-500 font-bold py-3 px-4 rounded-xl text-center cursor-not-allowed">
                            Access Expired
                          </button>
                        ) : (
                          <Link to={`/student/mock/${test.id}`} className="mt-auto w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-2">
                            Start Test
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </Link>
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
