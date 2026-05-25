import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultCourses } from '../../data/courses';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';
import { motion } from 'framer-motion';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

export default function BasicCourses() {
  const { user } = useAuth();
  const [priceTab, setPriceTab] = useState('all'); // all | free | paid
  const [typeTab, setTypeTab] = useState('all');   // all | basic | batch
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const { data: enrollments } = useRealtimeCollection('enrollments', {
    where: user?.uid ? [['uid', '==', user.uid]] : []
  });
  const location = useLocation();
  const linkPrefix = location.pathname.startsWith('/student') ? '/student/basic-courses' : '/basic/courses';

  const enrolledIds = new Set((enrollments || []).map(e => e.courseId));

  const allCourses = (coursesRaw?.length ? coursesRaw : defaultCourses);
  const courses = allCourses.filter(c => {
    if (typeTab === 'basic' && (c.courseType && c.courseType !== 'basic')) return false;
    if (typeTab === 'batch' && c.courseType !== 'batch') return false;
    if (priceTab === 'free' && !c.isFree) return false;
    if (priceTab === 'paid' && c.isFree) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Courses</h1>
          <p className="text-slate-400 text-sm">Browse all available courses</p>
        </div>
      </div>

      {/* Paid / Free tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-3">
        <button
          onClick={() => setPriceTab('all')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${priceTab === 'all' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-white'}`}
        >
          All
        </button>
        <button
          onClick={() => setPriceTab('free')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${priceTab === 'free' ? 'border-green-brand text-green-brand' : 'border-transparent text-slate-500 hover:text-white'}`}
        >
          Free
        </button>
        <button
          onClick={() => setPriceTab('paid')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${priceTab === 'paid' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-500 hover:text-white'}`}
        >
          Paid
        </button>
      </div>

      {/* Type sub-tabs */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {[
          { k: 'all', label: 'All Courses' },
          { k: 'basic', label: 'Basic' },
          { k: 'batch', label: 'Batch' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTypeTab(t.k)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${typeTab === t.k ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
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
          <p className="text-slate-400 text-sm">Nothing matches this filter.</p>
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
                  to={`${linkPrefix}/${c.id}`}
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
                    {c.courseType === 'batch' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">Batch</span>
                    )}
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
