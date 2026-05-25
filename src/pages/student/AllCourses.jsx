import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultCourses } from '../../data/courses';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';
import { motion } from 'framer-motion';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

const LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'jee', label: 'JEE' },
  { id: 'neet', label: 'NEET' },
  { id: 'board', label: 'Board Prep' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price-low', label: 'Price: Low → High' },
  { id: 'price-high', label: 'Price: High → Low' },
  { id: 'name-az', label: 'Name: A → Z' },
  { id: 'popular', label: 'Most Popular' },
];

export default function AllCourses() {
  const { user } = useAuth();
  const [priceTab, setPriceTab] = useState('all');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const { data: enrollments } = useRealtimeCollection('enrollments', {
    where: user?.uid ? [['uid', '==', user.uid]] : []
  });

  const enrolledIds = new Set((enrollments || []).map(e => e.courseId));

  const allCourses = coursesRaw?.length ? coursesRaw : defaultCourses;

  const courses = useMemo(() => {
    let result = allCourses.filter(c => {
      // Price tab
      if (priceTab === 'free' && !c.isFree) return false;
      if (priceTab === 'paid' && c.isFree) return false;

      // Level filter
      if (levelFilter !== 'all') {
        const lvl = (c.level || c.category || '').toLowerCase();
        if (levelFilter === 'foundation' && !lvl.includes('foundation') && !lvl.includes('class')) return false;
        if (levelFilter === 'intermediate' && !lvl.includes('intermediate')) return false;
        if (levelFilter === 'competitive' && !lvl.includes('competitive')) return false;
        if (levelFilter === 'jee' && !lvl.includes('jee') && !lvl.includes('iit')) return false;
        if (levelFilter === 'neet' && !lvl.includes('neet') && !lvl.includes('medical')) return false;
        if (levelFilter === 'board' && !lvl.includes('board')) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchSubjects = (c.subjects || []).some(s => s.toLowerCase().includes(q));
        const matchLevel = (c.level || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubjects && !matchLevel) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const getMinPrice = (c) => c.isFree ? 0 : (c.variants?.length ? Math.min(...c.variants.map(v => Number(v.price) || 0)) : 0);
      switch (sortBy) {
        case 'price-low': return getMinPrice(a) - getMinPrice(b);
        case 'price-high': return getMinPrice(b) - getMinPrice(a);
        case 'name-az': return (a.title || '').localeCompare(b.title || '');
        case 'popular': return (b.students || 0) - (a.students || 0);
        default: return 0; // newest = keep Firestore order
      }
    });

    return result;
  }, [allCourses, priceTab, levelFilter, search, sortBy]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">All Courses</h1>
          <p className="text-slate-400 text-sm">Browse the full catalog. Enroll to unlock access.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses by name, subject, or level..."
          className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-green-brand/50 focus:outline-none"
        />

        <div className="flex flex-wrap gap-3 items-center">
          {/* Price tabs */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            {['all', 'free', 'paid'].map(tab => (
              <button
                key={tab}
                onClick={() => setPriceTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors capitalize ${priceTab === tab ? 'bg-green-brand text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Level dropdown */}
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-green-brand/50 focus:outline-none"
          >
            {LEVELS.map(l => <option key={l.id} value={l.id} className="bg-slate-900">{l.label}</option>)}
          </select>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-green-brand/50 focus:outline-none"
          >
            {SORT_OPTIONS.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>)}
          </select>

          {/* Result count */}
          <span className="text-xs text-slate-500 ml-auto">{courses.length} course{courses.length !== 1 ? 's' : ''} found</span>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] rounded-2xl p-6 border border-slate-800 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-white/5 mb-3" />
              <div className="h-5 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-4 bg-white/5 rounded w-full mb-1" />
              <div className="h-4 bg-white/5 rounded w-2/3 mb-4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-4">
            <BookOpenIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Courses</h3>
          <p className="text-slate-400 text-sm">Nothing matches your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, idx) => {
            const IconComponent = iconMap[c.image] || BookOpenIcon;
            const startingPrice = c.variants?.length
              ? Math.min(...c.variants.map(v => Number(v.price) || 0))
              : null;
            const isEnrolled = enrolledIds.has(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Link
                  to={`/student/courses/${c.id}`}
                  className="bg-[#111111] rounded-2xl p-6 border border-slate-800 hover:border-green-brand/30 transition-all no-underline flex flex-col h-full group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: `${c.color || '#3b82f6'}15`, color: c.color || '#3b82f6' }}
                    >
                      <IconComponent size={20} />
                    </div>
                    {isEnrolled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-brand/20 text-green-brand uppercase tracking-wider">Enrolled</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-1 group-hover:text-green-brand transition-colors">{c.title}</h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(c.subjects || []).map(s => (
                      <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
                    <span>{c.duration}</span>
                    <span className="inline-flex items-center gap-1 text-slate-400"><UsersIcon size={14} /> {c.students || 0}</span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    {c.isFree ? (
                      <span className="text-green-brand font-bold text-sm">Free</span>
                    ) : startingPrice !== null ? (
                      <span className="text-amber-400 font-bold text-sm">From ₹{startingPrice}</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Details</span>
                    )}
                    <span className="text-xs text-white group-hover:translate-x-1 transition-transform">{isEnrolled ? 'Access →' : 'View →'}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
