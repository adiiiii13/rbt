import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultCourses } from '../../data/courses';
import { defaultPdfs } from '../../data/pdfs';
import {
  BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon,
  HeartPulseIcon, UsersIcon, FileTextIcon, DownloadIcon
} from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon,
  Rocket: RocketIcon, HeartPulse: HeartPulseIcon,
};

const TABS = [
  { id: 'courses', label: 'Courses', icon: BookOpenIcon },
  { id: 'tests', label: 'Test Papers', icon: FileTextIcon },
  { id: 'material', label: 'Study Material', icon: GraduationCapIcon },
];

export default function StudentBuyCourses() {
  const { user } = useAuth();
  const [tab, setTab] = useState('courses');

  const { data: coursesRaw } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const { data: pdfsRaw } = useRealtimeCollection('pdfs', { fallback: defaultPdfs });
  const { data: materialRaw } = useRealtimeCollection('studyMaterial', { fallback: [] });

  // Show all buyable items — batch students can buy extras on top of batch
  const courses = (coursesRaw?.length ? coursesRaw : defaultCourses).filter(
    (c) => c.courseType !== 'batch' || c.batchId === user?.assignedBatchId
  );
  const pdfs = pdfsRaw?.length ? pdfsRaw : defaultPdfs;
  const materials = materialRaw || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Catalog</h1>
          <p className="text-slate-400 text-sm">Browse courses, test papers, and study material</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Courses tab */}
      {tab === 'courses' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-12">No courses available.</p>
          ) : courses.map((c) => {
            const IconComponent = iconMap[c.image] || BookOpenIcon;
            const startingPrice = c.variants?.length
              ? Math.min(...c.variants.map((v) => Number(v.price) || 0))
              : null;
            return (
              <Link
                key={c.id}
                to={`/student/courses/${c.id}`}
                className="bg-[#111111] rounded-2xl p-6 border border-slate-800 hover:border-green-brand/30 transition-all no-underline flex flex-col"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${c.color || '#3b82f6'}15`, color: c.color || '#3b82f6' }}
                >
                  <IconComponent size={20} />
                </div>
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{c.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(c.subjects || []).map((s) => (
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
                    <span className="text-green-brand font-bold text-sm">From ₹{startingPrice}</span>
                  ) : (
                    <span className="text-slate-500 text-xs">Details</span>
                  )}
                  <span className="text-xs text-white">View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Tests tab */}
      {tab === 'tests' && (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
          {pdfs.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No test papers available.</p>
          ) : (
            <div className="table-container">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-slate-800">
                  <tr>
                    <th className="text-white font-bold">Title</th>
                    <th className="text-white font-bold">Class</th>
                    <th className="text-white font-bold">Subject</th>
                    <th className="text-white font-bold">Type</th>
                    <th className="text-white font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pdfs.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="font-medium text-white">{p.title}</td>
                      <td><span className="badge badge-green">{p.class}</span></td>
                      <td className="text-slate-300">{p.subject}</td>
                      <td className="text-slate-300">{p.examType}</td>
                      <td>
                        {p.fileUrl || p.url ? (
                          <a
                            href={p.fileUrl || p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold bg-green-brand/10 text-green-brand py-1.5 px-3 rounded-lg hover:bg-green-brand/20 inline-flex items-center gap-1.5 border border-green-brand/20 no-underline"
                          >
                            <DownloadIcon size={14} /> Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">No file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Material tab */}
      {tab === 'material' && (
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-3">No study material uploaded yet.</p>
              <Link to="/student/study-material" className="text-green-brand text-sm hover:text-green-400 no-underline">
                Browse all study material →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {materials.slice(0, 12).map((m) => (
                <Link
                  key={m.id}
                  to="/student/study-material"
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-green-brand/30 transition-all no-underline"
                >
                  <div className="text-emerald-400 mb-2"><FileTextIcon size={20} /></div>
                  <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{m.title || m.name}</h3>
                  <p className="text-xs text-slate-500">{m.subject || m.category || 'Material'}</p>
                </Link>
              ))}
              <Link
                to="/student/study-material"
                className="bg-green-brand/10 border border-green-brand/20 rounded-xl p-4 flex items-center justify-center text-green-brand text-sm font-medium hover:bg-green-brand/20 transition-all no-underline"
              >
                View All →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
