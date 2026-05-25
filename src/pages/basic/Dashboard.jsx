import { useAuth } from '../../context/AuthContext'
import { useRealtimeCollection } from '../../lib/contentApi'
import { defaultCourses } from '../../data/courses'
import { defaultVideos } from '../../data/videos'
import { defaultPdfs } from '../../data/pdfs'
import { Link } from 'react-router-dom'
import { BookOpenIcon, PlayCircleIcon, FileTextIcon } from '../../components/Icons'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect, useState } from 'react'

export default function BasicDashboard() {
  const { user } = useAuth()
  const { data: courses } = useRealtimeCollection('courses', 'createdAt', defaultCourses)
  const { data: videos } = useRealtimeCollection('videos', 'createdAt', defaultVideos)
  const { data: pdfs } = useRealtimeCollection('pdfs', 'createdAt', defaultPdfs)

  const [enrolledCourseIds, setEnrolledCourseIds] = useState([])

  useEffect(() => {
    if (!user?.uid) return
    let alive = true
    const fetchEnrollments = async () => {
      try {
        const q = query(collection(db, 'enrollments'), where('uid', '==', user.uid))
        const snap = await getDocs(q)
        if (!alive) return
        const ids = snap.docs
          .map(d => d.data())
          .filter(e => {
            if (e.status === 'revoked') return false;
            if (!e.enrolledAt || !e.months) return true;
            const enrolledDate = e.enrolledAt.toDate ? e.enrolledAt.toDate() : new Date(e.enrolledAt);
            if (e.months >= 1200) return true; // Lifetime
            const expiryMs = enrolledDate.getTime() + (e.months * 30 * 24 * 60 * 60 * 1000);
            return new Date().getTime() <= expiryMs;
          })
          .map(e => e.courseId)
        setEnrolledCourseIds(ids)
      } catch (err) {
        console.error("Error fetching enrollments:", err)
      }
    }
    fetchEnrollments()
    return () => { alive = false }
  }, [user])

  const myCourses = courses.filter(c => enrolledCourseIds.includes(c.id))

  const freeVideos = videos.filter(v => v.isFree !== false).slice(0, 3)
  const freePdfs = pdfs.slice(0, 3)

  return (
    <div>
      {user?.batchStatus === 'pending' && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-amber-400 font-bold mb-1">Batch Application Pending</h3>
              <p className="text-sm text-amber-200/80">Your offline batch application is under review. RBT team will call you within 24h.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        </div>
      )}

      {user?.batchStatus === 'called' && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-blue-400 font-bold mb-1">Application Under Review</h3>
              <p className="text-sm text-blue-200/80">We have contacted you. Please visit the institution to complete enrollment.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>
            </div>
          </div>
        </div>
      )}

      {user?.batchStatus === 'rejected' && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h3 className="text-red-400 font-bold mb-1">Batch Application Rejected</h3>
          <p className="text-sm text-red-200/80 mb-3">Your previous application was rejected. You can apply again with updated details.</p>
          <Link to="/basic/upgrade-batch" className="inline-block px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm no-underline">
            Apply Again
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome, {user?.name || 'Student'}</h1>
        <p className="text-slate-400 text-sm">
          Browse free content and courses
          {user?.studentId ? ` • ID: ${user.studentId}` : user?.id ? ` • ID: RBT-${user.id.substring(0, 6).toUpperCase()}` : ''}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-linear-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-5 border border-blue-500/20">
          <div className="text-blue-400 mb-3"><BookOpenIcon size={22} /></div>
          <p className="text-2xl font-bold text-white mb-0.5">{courses.length}</p>
          <p className="text-xs text-slate-400">Courses</p>
        </div>
        <div className="bg-linear-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-5 border border-emerald-500/20">
          <div className="text-emerald-400 mb-3"><PlayCircleIcon size={22} /></div>
          <p className="text-2xl font-bold text-white mb-0.5">{freeVideos.length}</p>
          <p className="text-xs text-slate-400">Free Videos</p>
        </div>
        <div className="bg-linear-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-5 border border-amber-500/20">
          <div className="text-amber-400 mb-3"><FileTextIcon size={22} /></div>
          <p className="text-2xl font-bold text-white mb-0.5">{freePdfs.length}</p>
          <p className="text-xs text-slate-400">Test Papers</p>
        </div>
      </div>

      {/* Courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Available Courses</h2>
          <Link to="/courses" className="text-sm text-green-brand hover:text-green-400 no-underline">View All</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.slice(0, 3).map(c => (
            <div key={c.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
              <h3 className="font-bold text-white mb-1">{c.title}</h3>
              <p className="text-sm text-slate-400 mb-2 line-clamp-2">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{c.level}</span>
                <span>•</span>
                <span>{c.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">My Enrolled Courses</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map(c => (
              <Link key={c.id} to={`/basic/courses/${c.id}`} className="bg-green-brand/10 border border-green-brand/20 rounded-2xl p-5 block no-underline hover:border-green-brand/50 transition-all">
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-slate-400 mb-2 line-clamp-2">{c.description}</p>
                <div className="text-xs text-green-brand font-medium mt-3">Continue Learning →</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Free Videos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Demo Videos</h2>
          <Link to="/videos" className="text-sm text-green-brand hover:text-green-400 no-underline">View All</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {freeVideos.map(v => (
            <Link key={v.id} to={`/video/${v.id}`} target="_blank" className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden no-underline hover:border-green-brand/30 transition-all">
              <div className="aspect-video bg-white/5 flex items-center justify-center">
                <span className="text-white/30"><PlayCircleIcon size={32} /></span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-white">{v.title}</p>
                <p className="text-xs text-slate-500">{v.subject} • {v.duration}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Free Test Papers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Free Test Series</h2>
        </div>
        <div className="space-y-3">
          {freePdfs.map(p => (
            <div key={p.id} className="bg-[#111111] rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{p.title}</p>
                <p className="text-xs text-slate-500">{p.subject} • {p.examType}</p>
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener" className="text-sm text-green-brand font-semibold no-underline hover:text-green-400">Download</a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {(!user?.batchStatus || user.batchStatus === 'none') && (
        <div className="bg-linear-to-br from-green-brand/10 to-green-dark/5 rounded-2xl p-6 border border-green-brand/20 text-center">
          <h3 className="text-white font-bold mb-2">Want Offline Batch Access?</h3>
          <p className="text-sm text-slate-400 mb-4">Apply for offline classroom batch. Get counselling, notices, achievements, invoices and full institutional access.</p>
          <Link to="/basic/upgrade-batch" className="inline-block px-6 py-2.5 bg-green-brand hover:bg-green-600 text-white font-bold rounded-xl text-sm no-underline transition-colors">
            Apply for Offline Batch →
          </Link>
        </div>
      )}
    </div>
  )
}
