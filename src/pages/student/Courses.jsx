import { getCourses } from '../../data/courses';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';

const iconMap = {
  BookOpen: BookOpenIcon,
  Flask: FlaskIcon,
  GraduationCap: GraduationCapIcon,
  Rocket: RocketIcon,
  HeartPulse: HeartPulseIcon,
};

export default function StudentCourses() {
  const courses = getCourses();
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-1">My Courses</h1>
      <p className="text-slate-600 text-sm mb-6">Browse all available courses</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => {
          const IconComponent = iconMap[c.image] || BookOpenIcon;
          return (
          <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-green-brand/30 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color}15`, color: c.color }}><IconComponent size={20} /></div>
            <h3 className="font-bold text-navy mb-1">{c.title}</h3>
            <p className="text-sm text-slate-600 mb-3">{c.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">{c.subjects.map(s => <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">{s}</span>)}</div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500"><span>{c.duration}</span><span className="inline-flex items-center gap-1 text-slate-600"><UsersIcon size={14} /> {c.students}</span></div>
          </div>
        )})}
      </div>
    </div>
  );
}
