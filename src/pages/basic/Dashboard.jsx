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
        const ids = snap.docs.map(d => d.data().courseId)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome, {user?.name || 'Student'}</h1>
        <p className="text-slate-400 text-sm">
          Browse free content and courses
          {user?.studentId ? ` • ID: ${user.studentId}` : user?.id ? ` • ID: RBT-${user.id.substring(0, 6).toUpperCase()}` : ''}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-5 border border-blue-500/20">
          <div className="text-blue-400 mb-3"><BookOpenIcon size={22} /></div>
          <p className="text-2xl font-bold text-white mb-0.5">{courses.length}</p>
          <p className="text-xs text-slate-400">Courses</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-5 border border-emerald-500/20">
          <div className="text-emerald-400 mb-3"><PlayCircleIcon size={22} /></div>
          <p className="text-2xl font-bold text-white mb-0.5">{freeVideos.length}</p>
          <p className="text-xs text-slate-400">Free Videos</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-5 border border-amber-500/20">
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
      <div className="bg-gradient-to-br from-green-brand/10 to-green-dark/5 rounded-2xl p-6 border border-green-brand/20 text-center">
        <h3 className="text-white font-bold mb-2">Want Full Access?</h3>
        <p className="text-sm text-slate-400 mb-3">Get counselling, notices, achievements, invoices and more with Batch Student access.</p>
        <p className="text-xs text-slate-500">Contact admin to enroll in a batch.</p>
      </div>
    </div>
  )
}
