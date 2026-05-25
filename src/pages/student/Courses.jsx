import { Link } from 'react-router-dom';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultCourses } from '../../data/courses';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon, UsersIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

export default function StudentCourses() {
  const { user } = useAuth();
  
  const { data: enrollments } = useRealtimeCollection('enrollments', {
    where: [['uid', '==', user.uid]]
  });

  const { data: coursesRaw } = useRealtimeCollection('courses', { fallback: defaultCourses });
  
  const enrolledCourseIds = new Set((enrollments || []).map(e => e.courseId));

  const courses = (coursesRaw?.length ? coursesRaw : defaultCourses).filter(c => 
    enrolledCourseIds.has(c.id)
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Courses</h1>
          <p className="text-slate-400 text-sm">Access your enrolled courses</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white/5 rounded-2xl border border-white/10">
            You haven't enrolled in any courses yet. Go to Buy Courses to browse available courses.
          </div>
        ) : courses.map(c => {
          const IconComponent = iconMap[c.image] || BookOpenIcon;
          return (
            <Link
              key={c.id}
              to={`/student/courses/${c.id}`}
              className="bg-[#111111] rounded-2xl p-6 border border-slate-800 hover:border-green-brand/30 transition-all no-underline flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color || '#3b82f6'}15`, color: c.color || '#3b82f6' }}>
                <IconComponent size={20} />
              </div>
              <h3 className="font-bold text-white mb-1">{c.title}</h3>
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
                <span className="text-green-brand font-bold text-sm">Enrolled</span>
                <span className="text-xs text-white">Access Course →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
