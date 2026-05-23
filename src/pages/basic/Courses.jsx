import { Link } from 'react-router-dom';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultCourses } from '../../data/courses';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';
import { motion } from 'framer-motion';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

export default function BasicCourses() {
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const courses = (coursesRaw?.length ? coursesRaw : defaultCourses).filter(c => !c.courseType || c.courseType === 'basic');

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
          <h3 className="text-lg font-bold text-white mb-2">No Courses Yet</h3>
          <p className="text-slate-400 text-sm">Check back soon — courses are being added.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, idx) => {
            const IconComponent = iconMap[c.image] || BookOpenIcon;
            const startingPrice = c.variants?.length
              ? Math.min(...c.variants.map(v => Number(v.price) || 0))
              : null;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Link
                  to={`/basic/courses/${c.id}`}
                  className="bg-[#111111] rounded-2xl p-6 border border-slate-800 hover:border-green-brand/30 transition-all no-underline flex flex-col h-full group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${c.color || '#3b82f6'}15`, color: c.color || '#3b82f6' }}
                  >
                    <IconComponent size={20} />
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
                    {startingPrice !== null ? (
                      <span className="text-green-brand font-bold text-sm">From ₹{startingPrice}</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Details</span>
                    )}
                    <span className="text-xs text-white group-hover:translate-x-1 transition-transform">View →</span>
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
