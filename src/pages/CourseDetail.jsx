import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { generateInvoiceNumber, formatCurrency } from '../lib/invoice'
import { openCheckout } from '../lib/razorpay'
import { sendCoursePaymentSuccessEmail } from '../lib/emailUtils'
import HlsPlayer from '../components/HlsPlayer'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

const ytId = (url) => {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

const TABS = ['Lessons', 'Doubts', 'Inquiry', 'Report']

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrollment, setEnrollment] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [currentItem, setCurrentItem] = useState(0)
  const [buying, setBuying] = useState(false)
  const [tab, setTab] = useState('Content')
  const [doubts, setDoubts] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [reports, setReports] = useState([])
  const [doubtForm, setDoubtForm] = useState({ question: '', lessonTitle: '' })
  const [inquiryForm, setInquiryForm] = useState({ message: '' })
  const [reportForm, setReportForm] = useState({ subject: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', id))
        if (!alive) return
        if (!snap.exists()) { toast.error('Course not found'); navigate('/courses'); return }
        const data = { id: snap.id, ...snap.data() }
        setCourse(data)
        if (data.variants?.length) setSelectedVariant(data.variants[0])

        if (user) {
          const enrolQ = query(collection(db, 'enrollments'), where('uid', '==', user.uid), where('courseId', '==', id))
          const enrolSnap = await getDocs(enrolQ)
          if (!enrolSnap.empty) setEnrollment({ id: enrolSnap.docs[0].id, ...enrolSnap.docs[0].data() })
          // If course is a batch course and user has batch access, treat as enrolled
          if (enrolSnap.empty && data.courseType === 'batch' && user.batch === true) {
            setEnrollment({ id: 'batch-access', uid: user.uid, courseId: id, months: 1200, amount: 0 })
          }

          // Load per-course doubts
          const dQ = query(collection(db, 'courseDoubts'), where('courseId', '==', id), where('studentUid', '==', user.uid))
          const dSnap = await getDocs(dQ)
          setDoubts(dSnap.docs.map(d => ({ id: d.id, ...d.data() })))

          // Load per-course inquiries
          const iQ = query(collection(db, 'courseInquiries'), where('courseId', '==', id), where('studentUid', '==', user.uid))
          const iSnap = await getDocs(iQ)
          setInquiries(iSnap.docs.map(d => ({ id: d.id, ...d.data() })))

          // Load per-course reports
          const rQ = query(collection(db, 'courseReports'), where('courseId', '==', id), where('studentUid', '==', user.uid))
          const rSnap = await getDocs(rQ)
          setReports(rSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (err) { toast.error(err.message) }
      finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [id, user, navigate])

  const { modules, flatItems } = useMemo(() => {
    if (!course) return { modules: [], flatItems: [] }
    let mods = course.modules || []
    
    // Backwards compatibility
    if (mods.length === 0 && course.lessons?.length > 0) {
      mods = [{
        id: 'legacy_module',
        title: 'Course Content',
        items: [...course.lessons].sort((a,b) => (a.order||0)-(b.order||0)).map(l => ({
          ...l, type: 'video', data: l.videoUrl
        }))
      }]
    }

    const sortedMods = [...mods].sort((a,b) => (a.order||0)-(b.order||0))
    const flat = []
    
    sortedMods.forEach((m, mIdx) => {
      if (m.items) {
        m.items.sort((a,b) => (a.order||0)-(b.order||0)).forEach((itm, iIdx) => {
          flat.push({ ...itm, moduleTitle: m.title, moduleIndex: mIdx, itemIndex: iIdx })
        })
      }
    })
    
    return { modules: sortedMods, flatItems: flat }
  }, [course])

  // Free → enroll + paid invoice. Paid → Razorpay (CF creates enrollment + invoice + notify).
  const handleEnroll = async () => {
    if (!user) { toast.error('Please login first'); navigate('/student-login'); return }
    const variant = selectedVariant || { months: 12, price: 0 }
    const isFree = variant.price === 0 || course.isFree

    setBuying(true)

    if (isFree) {
      try {
        const enrolRef = await addDoc(collection(db, 'enrollments'), {
          uid: user.uid,
          courseId: course.id,
          courseName: course.title,
          months: variant.months,
          amount: variant.price,
          status: 'active',
          enrolledAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          studentName: user.name || '',
          studentEmail: user.email || '',
        })

        await updateDoc(doc(db, 'courses', course.id), { students: increment(1) })

        const invoiceNum = generateInvoiceNumber(enrolRef.id)
        const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

        await addDoc(collection(db, 'invoices'), {
          invoiceNumber: invoiceNum,
          studentUid: user.uid,
          studentName: user.name || '',
          studentEmail: user.email || '',
          courseName: course.title,
          description: `${variant.months}-month plan (Free)`,
          amount: variant.price,
          status: 'paid',
          paidAt,
          issuedDate: paidAt,
          method: 'free',
          enrollmentId: enrolRef.id,
          createdAt: serverTimestamp(),
        })

        await addDoc(collection(db, 'notifications'), {
          studentUid: user.uid,
          studentName: user.name || '',
          subject: `Enrolled: ${course.title}`,
          message: `You're enrolled! Invoice: ${invoiceNum}. Start watching now.`,
          read: false,
          createdAt: serverTimestamp(),
        })

        setEnrollment({ id: enrolRef.id, uid: user.uid, courseId: course.id, months: variant.months, amount: variant.price })
        toast.success('🎉 Enrolled! Start learning now.')
      } catch (err) { toast.error(err.message) }
      finally { setBuying(false) }
      return
    }

    // Paid path → Razorpay (server creates enrollment + paid invoice + notify + admin alert)
    openCheckout({
      amount: variant.price,
      courseId: course.id,
      courseTitle: course.title,
      name: 'RBT Mission Learning',
      description: `${course.title} — ${variant.months}-Month Plan`,
      variantMonths: variant.months,
      variantPrice: variant.price,
      user,
      onSuccess: async (result) => {
        setEnrollment({
          id: result.enrollmentId,
          uid: user.uid,
          courseId: course.id,
          paymentId: result.paymentId,
        })
        try {
          await sendCoursePaymentSuccessEmail(user.name, user.email, course.title, variant.price, result.paymentId)
        } catch(e) { console.error('Failed to send success email', e) }
        toast.success('🎉 Payment received. Enrolled!')
        setBuying(false)
      },
      onFailure: (err) => {
        toast.error(err.message || 'Payment failed')
        setBuying(false)
      },
    })
  }

  const submitDoubt = async () => {
    if (!doubtForm.question.trim()) { toast.error('Ask your question'); return }
    setSubmitting(true)
    try {
      const ref = await addDoc(collection(db, 'courseDoubts'), {
        courseId: course.id, courseName: course.title,
        studentUid: user.uid, studentName: user.name || '',
        question: doubtForm.question, lessonTitle: doubtForm.lessonTitle,
        answer: '', status: 'pending', createdAt: serverTimestamp(),
      })
      setDoubts(prev => [...prev, { id: ref.id, ...doubtForm, courseId: course.id, studentUid: user.uid, answer: '', status: 'pending' }])
      setDoubtForm({ question: '', lessonTitle: '' })
      toast.success('Doubt submitted')
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const submitInquiry = async () => {
    if (!inquiryForm.message.trim()) { toast.error('Write your inquiry'); return }
    setSubmitting(true)
    try {
      const ref = await addDoc(collection(db, 'courseInquiries'), {
        courseId: course.id, courseName: course.title,
        studentUid: user.uid, studentName: user.name || '',
        message: inquiryForm.message, status: 'pending', createdAt: serverTimestamp(),
      })
      setInquiries(prev => [...prev, { id: ref.id, ...inquiryForm, courseId: course.id, studentUid: user.uid, status: 'pending' }])
      setInquiryForm({ message: '' })
      toast.success('Inquiry sent')
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const submitReport = async () => {
    if (!reportForm.subject.trim() || !reportForm.description.trim()) { toast.error('Fill all fields'); return }
    setSubmitting(true)
    try {
      const ref = await addDoc(collection(db, 'courseReports'), {
        courseId: course.id, courseName: course.title,
        studentUid: user.uid, studentName: user.name || '',
        subject: reportForm.subject, description: reportForm.description,
        status: 'open', createdAt: serverTimestamp(),
      })
      setReports(prev => [...prev, { id: ref.id, ...reportForm, courseId: course.id, studentUid: user.uid, status: 'open' }])
      setReportForm({ subject: '', description: '' })
      toast.success('Report submitted')
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#050B14] flex items-center justify-center"><Skeleton className="w-full max-w-5xl h-96 rounded-2xl" /></div>
  if (!course) return null

  // ─── Enrolled view ───
  if (enrollment) {
    const item = flatItems[currentItem]
    
    const renderItemContent = (item) => {
      if (!item) return null;
      if (item.type === 'video') {
        return (
          <div className="bg-black rounded-2xl overflow-hidden mb-4">
            <HlsPlayer key={item.id} url={item.data} watermark={user?.email || 'RBT'}
              onEnded={() => currentItem < flatItems.length - 1 && setCurrentItem(currentItem + 1)} />
          </div>
        )
      }
      if (item.type === 'pdf') {
        return (
          <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">PDF Document</h2>
            <p className="text-slate-400 mb-6">Click below to view or download this document.</p>
            <a href={item.data} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">Open PDF</a>
          </div>
        )
      }
      if (item.type === 'link') {
        return (
          <div className="bg-white/5 rounded-2xl p-6 mb-4 border border-white/10 text-center">
            <div className="w-16 h-16 bg-purple-500/20 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">External Link</h2>
            <a href={item.data} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors">Visit Link</a>
          </div>
        )
      }
      if (item.type === 'text') {
        return (
          <div className="bg-white/5 rounded-2xl p-8 mb-4 border border-white/10 prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-300">{item.data}</div>
          </div>
        )
      }
      return null
    }

    return (
      <div className="min-h-screen bg-[#050B14]">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Link to="/student/courses" className="text-slate-400 hover:text-white text-sm mb-4 inline-block no-underline">← My Courses</Link>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10 mb-6">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-green-brand text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                {t}
                {t === 'Doubts' && doubts.filter(d => d.answer).length > 0 && <span className="ml-1.5 w-4 h-4 rounded-full bg-green-brand/20 text-green-brand text-[10px] inline-flex items-center justify-center font-bold">{doubts.filter(d => d.answer).length}</span>}
              </button>
            ))}
          </div>

          {/* Content tab */}
          {tab === 'Content' && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div>
                {item ? (
                  <>
                    {renderItemContent(item)}
                    <h1 className="text-2xl font-bold text-white mb-1">{item.title}</h1>
                    <p className="text-sm text-slate-400">Part {currentItem + 1} of {flatItems.length} • {item.moduleTitle}</p>
                    {item.description && <p className="text-slate-300 mt-3">{item.description}</p>}
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setCurrentItem(c => Math.max(0, c - 1))} disabled={currentItem === 0}
                        className="px-5 py-2.5 rounded-lg bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10">← Previous</button>
                      <button onClick={() => setCurrentItem(c => Math.min(flatItems.length - 1, c + 1))} disabled={currentItem === flatItems.length - 1}
                        className="px-5 py-2.5 rounded-lg bg-green-brand hover:bg-green-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                    </div>
                  </>
                ) : <p className="text-slate-500 text-center py-12">No content available.</p>}
              </div>
              <aside className="bg-white/5 border border-white/10 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
                <h3 className="text-white font-bold mb-3">Course Content</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {modules.map((m, mIdx) => (
                    <div key={m.id}>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{mIdx + 1}. {m.title}</h4>
                      <div className="space-y-1">
                        {m.items.map((itm) => {
                          const globalIdx = flatItems.findIndex(x => x.id === itm.id)
                          const isActive = globalIdx === currentItem
                          return (
                            <button key={itm.id} onClick={() => setCurrentItem(globalIdx)}
                              className={`w-full text-left p-2.5 rounded-lg transition-all ${isActive ? 'bg-green-brand/20 border border-green-brand text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 opacity-60">
                                  {itm.type === 'video' ? '▶' : itm.type === 'pdf' ? '📄' : itm.type === 'text' ? '📝' : '🔗'}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium leading-snug">{itm.title}</div>
                                  {itm.duration && <div className="text-xs text-slate-500 mt-0.5">{itm.duration}</div>}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {/* Doubts tab */}
          {tab === 'Doubts' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
                <h3 className="text-white font-bold mb-4">Ask a Doubt</h3>
                <select className="input-field mb-3" value={doubtForm.lessonTitle} onChange={e => setDoubtForm({...doubtForm, lessonTitle: e.target.value})}>
                  <option value="">Select topic (optional)</option>
                  {flatItems.map(itm => <option key={itm.id} value={itm.title}>{itm.title}</option>)}
                </select>
                <textarea className="input-field resize-none mb-3" rows={3} value={doubtForm.question} onChange={e => setDoubtForm({...doubtForm, question: e.target.value})} placeholder="Type your doubt..." />
                <button onClick={submitDoubt} disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Doubt'}</button>
              </div>
              {doubts.length > 0 && doubts.map(d => (
                <div key={d.id} className={`bg-[#111111] rounded-2xl p-5 border ${d.answer ? 'border-green-brand/20' : 'border-slate-800'}`}>
                  {d.lessonTitle && <span className="badge badge-navy text-xs mb-2 inline-block">{d.lessonTitle}</span>}
                  <p className="text-white text-sm">{d.question}</p>
                  {d.answer && <div className="mt-3 p-3 rounded-xl bg-green-brand/5 border border-green-brand/20"><p className="text-xs font-bold text-green-brand uppercase mb-1">Answer</p><p className="text-sm text-slate-300">{d.answer}</p></div>}
                </div>
              ))}
              {doubts.length === 0 && <p className="text-slate-500 text-center py-4">No doubts yet. Ask your first doubt above.</p>}
            </div>
          )}

          {/* Inquiry tab */}
          {tab === 'Inquiry' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
                <h3 className="text-white font-bold mb-4">Course Inquiry</h3>
                <textarea className="input-field resize-none mb-3" rows={4} value={inquiryForm.message} onChange={e => setInquiryForm({...inquiryForm, message: e.target.value})} placeholder="Ask about course details, prerequisites, schedule..." />
                <button onClick={submitInquiry} disabled={submitting} className="btn-primary">{submitting ? 'Sending...' : 'Send Inquiry'}</button>
              </div>
              {inquiries.map(i => (
                <div key={i.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
                  <p className="text-white text-sm">{i.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`badge text-xs ${i.status === 'answered' ? 'badge-green' : 'badge-gold'}`}>{i.status}</span>
                  </div>
                  {i.answer && <div className="mt-3 p-3 rounded-xl bg-green-brand/5 border border-green-brand/20"><p className="text-xs font-bold text-green-brand uppercase mb-1">Reply</p><p className="text-sm text-slate-300">{i.answer}</p></div>}
                </div>
              ))}
            </div>
          )}

          {/* Report tab */}
          {tab === 'Report' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
                <h3 className="text-white font-bold mb-4">Report an Issue</h3>
                <input className="input-field mb-3" value={reportForm.subject} onChange={e => setReportForm({...reportForm, subject: e.target.value})} placeholder="Subject (e.g. Video not playing, wrong answer...)" />
                <textarea className="input-field resize-none mb-3" rows={4} value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} placeholder="Describe the issue in detail..." />
                <button onClick={submitReport} disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Report'}</button>
              </div>
              {reports.map(r => (
                <div key={r.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
                  <p className="text-white font-bold text-sm">{r.subject}</p>
                  <p className="text-slate-400 text-sm mt-1">{r.description}</p>
                  <div className="mt-2"><span className={`badge text-xs ${r.status === 'resolved' ? 'badge-green' : r.status === 'investigating' ? 'badge-gold' : 'badge-navy'}`}>{r.status}</span></div>
                  {r.resolution && <div className="mt-3 p-3 rounded-xl bg-green-brand/5 border border-green-brand/20"><p className="text-xs font-bold text-green-brand uppercase mb-1">Resolution</p><p className="text-sm text-slate-300">{r.resolution}</p></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Not enrolled: show landing + buy ───
  return (
    <div className="min-h-screen bg-[#050B14] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/courses" className="text-slate-400 hover:text-white text-sm mb-6 inline-block no-underline">← Back to Courses</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="w-full aspect-video object-cover rounded-2xl mb-6 border border-slate-800" loading="lazy" />}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{course.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.level && <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{course.level}</span>}
              {course.duration && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">{course.duration}</span>}
              {flatItems.length > 0 && <span className="text-xs bg-green-brand/20 text-green-brand px-3 py-1 rounded-full">{flatItems.length} Content Items</span>}
              {course.isFree && <span className="text-xs bg-green-brand/20 text-green-brand px-3 py-1 rounded-full">Free Course</span>}
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">{course.description}</p>

            {course.subjects?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">Subjects</h3>
                <div className="flex flex-wrap gap-2">{course.subjects.map(s => <span key={s} className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded text-sm">{s}</span>)}</div>
              </div>
            )}

            {modules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-bold mb-3">Course Curriculum</h3>
                <div className="space-y-4">
                  {modules.map((m, mIdx) => (
                    <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-black/20 p-3 border-b border-white/10">
                        <h4 className="text-sm font-bold text-white">Module {mIdx + 1}: {m.title}</h4>
                        {m.description && <p className="text-xs text-slate-400 mt-1">{m.description}</p>}
                      </div>
                      <div className="divide-y divide-white/5">
                        {m.items.map((itm, iIdx) => (
                          <div key={itm.id} className="p-3 flex items-center gap-3">
                            <span className="opacity-50 text-xs">
                              {itm.type === 'video' ? '▶' : itm.type === 'pdf' ? '📄' : itm.type === 'text' ? '📝' : '🔗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium">{itm.title}</div>
                              {itm.duration && <div className="text-xs text-slate-500">{itm.duration}</div>}
                            </div>
                            {itm.isFree && <span className="text-[10px] bg-green-brand/20 text-green-brand px-2 py-0.5 rounded font-bold uppercase">Free Preview</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buy panel */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">{course.isFree ? 'Get Free Access' : 'Choose Your Plan'}</h3>

              {!course.isFree && course.variants?.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {course.variants.map((v, idx) => (
                    <button key={idx} onClick={() => setSelectedVariant(v)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedVariant === v ? 'bg-green-brand/15 border-green-brand' : 'bg-black/20 border-white/10 hover:border-white/20'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-bold">{v.label || `${v.months}-Month Access`}</span>
                        {v.discount && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{v.discount}</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{formatCurrency(v.price)}</span>
                        {v.originalPrice && v.originalPrice > v.price && <span className="text-sm text-slate-500 line-through">{formatCurrency(v.originalPrice)}</span>}
                      </div>
                      {v.note && <p className="text-xs text-slate-400 mt-1">{v.note}</p>}
                    </button>
                  ))}
                </div>
              ) : course.isFree ? (
                <p className="text-green-brand text-sm mb-4">This course is free! Enroll to start learning.</p>
              ) : (
                <p className="text-slate-400 text-sm mb-4">No plans configured.</p>
              )}

              <button
                onClick={() => {
                  if (course.courseType === 'batch' && !user?.batch) {
                    if (user) navigate('/student/upgrade-batch')
                    else navigate('/student-login')
                  } else {
                    handleEnroll()
                  }
                }}
                disabled={buying || (!course.isFree && !selectedVariant) || (course.courseType === 'batch' && user?.batchStatus === 'pending')}
                className="w-full bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                {buying ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4" strokeLinecap="round" /></svg>
                    Processing...
                  </>
                ) : course.courseType === 'batch' && !user?.batch
                    ? user?.batchStatus === 'pending' ? 'Batch Application Pending' : 'Apply for Offline Batch'
                    : course.isFree ? 'Free, enroll now'
                    : selectedVariant ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        Pay {formatCurrency(selectedVariant.price)} with Razorpay
                      </>
                    )
                    : 'Select a plan'}
              </button>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">✓ Instant access after enrollment</div>
                <div className="flex items-center gap-2">✓ Sequential video access</div>
                <div className="flex items-center gap-2">✓ Invoice auto-generated</div>
                <div className="flex items-center gap-2">✓ Ask doubts + report issues</div>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  )
}
