import { useRealtimeCollection } from '../../lib/contentApi';
import { defaultCourses } from '../../data/courses';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

export default function StudentCourses() {
  const { data: courses } = useRealtimeCollection('courses', 'createdAt', defaultCourses);
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">My Courses</h1>
      <p className="text-slate-400 text-sm mb-6">Browse all available courses</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => {
          const IconComponent = iconMap[c.image] || BookOpenIcon;
          return (
          <div key={c.id} className="bg-[#111111] rounded-2xl p-6 border border-slate-800 hover:border-green-brand/30 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color || '#3b82f6'}15`, color: c.color || '#3b82f6' }}><IconComponent size={20} /></div>
            <h3 className="font-bold text-white mb-1">{c.title}</h3>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{c.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">{(c.subjects || []).map(s => <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">{s}</span>)}</div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500"><span>{c.duration}</span><span className="inline-flex items-center gap-1 text-slate-400"><UsersIcon size={14} /> {c.students}</span></div>
          </div>
        )})}
      </div>
    </div>
  );
}
