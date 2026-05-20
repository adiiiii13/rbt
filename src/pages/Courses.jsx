import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRealtimeCollection } from '../lib/useRealtimeCollection';
import { defaultCourses } from '../data/courses';
import { Link } from 'react-router-dom';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../components/Icons';

const iconMap = {
  BookOpen: BookOpenIcon,
  Flask: FlaskIcon,
  GraduationCap: GraduationCapIcon,
  Rocket: RocketIcon,
  HeartPulse: HeartPulseIcon,
};

const LEVELS = [
  { id: 'all', label: 'All Courses', color: '#16a34a' },
  { id: 'foundation', label: 'Foundation 8–12', color: '#f59e0b' },
  { id: 'iit-jee', label: 'IIT-JEE', color: '#3b82f6' },
  { id: 'neet', label: 'NEET', color: '#10b981' },
];

export default function Courses() {
  const { data: coursesRaw } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const courses = coursesRaw?.length ? coursesRaw : defaultCourses;
  const [activeLevel, setActiveLevel] = useState('all');

  const filtered = activeLevel === 'all'
    ? courses
    : courses.filter(c => {
        const lvl = (c.level || c.category || c.title || '').toLowerCase();
        if (activeLevel === 'foundation') return lvl.includes('foundation') || lvl.includes('class') || /[89]|10|11|12/.test(lvl);
        if (activeLevel === 'iit-jee') return lvl.includes('jee') || lvl.includes('iit') || lvl.includes('engineering');
        if (activeLevel === 'neet') return lvl.includes('neet') || lvl.includes('medical') || lvl.includes('biology');
        return true;
      });
  return (
    <div className="bg-black">
      <section className="relative pt-28 pb-20 overflow-hidden min-h-[400px] flex items-center">
        {/* Background Image with Blue Transparency */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-1.webp"
            alt="Courses Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/40 via-[#000000]/60 to-[#000000]"></div>
        </div>

        <div className="container-main relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
          >
            <BookOpenIcon size={16} />
            <span>Learning Programs</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white font-[var(--font-heading)]"
          >
            Our Courses
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            Comprehensive programs designed for academic excellence at every level, from foundational basics to competitive mastery.
          </motion.p>
        </div>
      </section>

      <section className="py-12 bg-[#000000]">
        <div className="container-main">
          {/* Education Level Filter */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Browse by Level</p>
            <div className="flex flex-wrap gap-2.5">
              {LEVELS.map(lv => (
                <button
                  key={lv.id}
                  onClick={() => setActiveLevel(lv.id)}
                  className={`group inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    activeLevel === lv.id
                      ? 'text-white border'
                      : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                  }`}
                  style={activeLevel === lv.id ? {
                    background: `linear-gradient(135deg, ${lv.color}dd, ${lv.color}99)`,
                    borderColor: `${lv.color}50`,
                  } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                    style={{ background: activeLevel === lv.id ? 'rgba(255,255,255,0.9)' : lv.color }}
                  />
                  {lv.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => {
              const IconComponent = iconMap[course.image] || BookOpenIcon;
              return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass-card p-6 group hover:-translate-y-2 hover:border-green-brand/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 border border-transparent cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transform group-hover:scale-110 transition-transform duration-300" style={{ background: `${course.color}15`, color: course.color }}>
                    <IconComponent size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-green-light transition-colors duration-300">{course.title}</h3>
                    <span className="text-xs text-slate-400">{course.level} • {course.duration}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4">{course.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.subjects.map((s) => (<span key={s} className="text-xs px-2 py-1 rounded-md bg-white/10 text-slate-400">{s}</span>))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100/10">
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1"><UsersIcon size={14} /> {course.students} students</span>
                  <Link to="/contact" className="text-sm font-medium text-green-brand no-underline hover:text-green-dark group-hover:translate-x-1 transition-transform">Enroll Now →</Link>
                </div>
              </motion.div>
            )})}
          </div>
        </div>
      </section>
    </div>
  );
}
