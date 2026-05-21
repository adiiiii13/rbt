import { GridSkeleton } from '../components/ui/Skeleton';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useRealtimeCollection } from '../lib/useRealtimeCollection';
import { FileTextIcon, ClockIcon } from '../components/Icons';

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
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');
  const backTo = isDashboard ? location.pathname.replace(/\/mock\/?$/, '') : '/test-papers';
  const basePath = location.pathname.replace(/\/?$/, '');

  const { data: tests, loading } = useRealtimeCollection('mockTests', { fallback: [] });
  const [selectedCat, setSelectedCat] = useState('all');

  const filtered = selectedCat === 'all'
    ? tests
    : tests.filter(t => t.category === selectedCat);

  return (
    <div className={`${isDashboard ? 'bg-[#0a0a0a]' : 'bg-black'} pb-16 min-h-screen relative`}>
      <div className={`container-main max-w-7xl relative z-10 ${isDashboard ? 'pt-0' : 'pt-32'}`}>
        <Link to={backTo} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 no-underline text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Test Papers
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Online Mock Tests</h1>
          <p className="text-slate-400">Timed MCQ tests with instant scoring. Select an exam category below.</p>
        </div>

        {/* Education Level Filter Chips */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Filter by Category</p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setSelectedCat('all')}
              className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                selectedCat === 'all'
                  ? 'bg-green-brand text-white border border-green-400/40'
                  : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full transition-all ${
                selectedCat === 'all' ? 'bg-white' : 'bg-slate-600 group-hover:bg-slate-400'
              }`} />
              All Tests
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                  selectedCat === c.id
                    ? 'text-white border'
                    : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                }`}
                style={selectedCat === c.id ? {
                  background: `linear-gradient(135deg, ${c.color}dd, ${c.color}99)`,
                  borderColor: `${c.color}50`,
                } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full transition-all flex-shrink-0"
                  style={{ background: selectedCat === c.id ? 'rgba(255,255,255,0.9)' : c.color }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <GridSkeleton count={6} type="card" />}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No mock tests available in this category yet.</p>
            <p className="text-slate-500 text-sm mt-2">Admin can add mock tests from the admin panel.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((test, idx) => {
            const cat = CATEGORIES.find(c => c.id === test.category) || { label: test.category, color: '#6366f1' };
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-green-brand/30 transition-all overflow-hidden flex flex-col"
              >
                <div className="h-2" style={{ background: cat.color }} />
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                    {test.difficulty && (
                      <span className="text-xs text-slate-400">{test.difficulty}</span>
                    )}
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

                  <Link
                    to={`${basePath}/${test.id}`}
                    className="mt-auto w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-center no-underline inline-flex items-center justify-center gap-2"
                  >
                    Start Test
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
