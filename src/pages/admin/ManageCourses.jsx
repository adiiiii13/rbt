import { TableSkeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'
import { deleteItemSmart } from '../../lib/contentApi'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers'
import { defaultCourses } from '../../data/courses'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon } from '../../components/Icons'

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon }

const LEVELS = ['Foundation', 'Intermediate', 'Competitive', 'JEE', 'NEET', 'Board Prep']
const ICONS = ['BookOpen', 'Flask', 'GraduationCap', 'Rocket', 'HeartPulse']

const ytId = (url) => {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : ''
}
const ytThumb = (url) => { const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '' }

export default function ManageCourses() {
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses })
  const courses = coursesRaw?.length ? coursesRaw : defaultCourses
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [step, setStep] = useState(1) // 1-4

  // Step 1: Basic
  const [basic, setBasic] = useState({ title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months', thumbnail: '', image: 'BookOpen', color: '#3b82f6', isFree: false })

  // Step 2: Pricing
  const [pricing, setPricing] = useState([{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: 'Most Popular' }])

  // Step 3: Lessons
  const [lessons, setLessons] = useState([])

  const [thumbUploading, setThumbUploading] = useState(false)

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return }
    setThumbUploading(true)
    try {
      const path = `public/courses/${Date.now()}_${file.name}`
      const url = await uploadFile(path, file)
      setBasic(b => ({ ...b, thumbnail: url }))
      toast.success('Thumbnail uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setThumbUploading(false) }
  }

  const reset = () => {
    setStep(1)
    setBasic({ title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months', thumbnail: '', image: 'BookOpen', color: '#3b82f6', isFree: false })
    setPricing([{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: 'Most Popular' }])
    setLessons([])
  }

  const openCreate = () => { setEditing(null); reset(); setModal(true) }

  const openEdit = (c) => {
    setEditing(c)
    setBasic({
      title: c.title || '', description: c.description || '',
      subjects: Array.isArray(c.subjects) ? c.subjects.join(', ') : '',
      level: c.level || 'Foundation', duration: c.duration || '12 Months',
      thumbnail: c.thumbnail || '', image: c.image || 'BookOpen',
      color: c.color || '#3b82f6', isFree: !!c.isFree,
    })
    setPricing(c.variants?.length ? c.variants : [{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: '' }])
    setLessons(c.lessons || [])
    setStep(1)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null); reset() }

  const addPricing = () => setPricing(p => [...p, { months: 1, price: 1999, originalPrice: 2999, discount: '', note: '' }])
  const removePricing = (i) => setPricing(p => p.filter((_, idx) => idx !== i))

  const addLesson = () => setLessons(l => [...l, { id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, title: '', videoUrl: '', duration: '', description: '', isFree: false }])
  const removeLesson = (i) => setLessons(l => l.filter((_, idx) => idx !== i))
  const moveLesson = (i, dir) => {
    setLessons(l => {
      const a = [...l]; const j = i + dir
      if (j < 0 || j >= a.length) return l
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  }

  const save = async () => {
    if (!basic.title.trim()) { toast.error('Title required'); return }
    const subjectsArr = basic.subjects.split(',').map(s => s.trim()).filter(Boolean)
    const autoThumb = !basic.thumbnail ? ytThumb(lessons[0]?.videoUrl) : ''
    const payload = {
      ...basic, subjects: subjectsArr, thumbnail: basic.thumbnail || autoThumb,
      isFree: basic.isFree,
      variants: pricing.map(v => ({ ...v, months: Number(v.months), price: Number(v.price), originalPrice: Number(v.originalPrice) })),
      lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })),
    }
    try {
      if (editing) { await updateDocument('courses', editing.id, payload); toast.success('Updated') }
      else { await addDocument('courses', payload); toast.success('Course added') }
      closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteItemSmart('courses', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const steps = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Pricing' },
    { n: 3, label: 'Lessons' },
    { n: 4, label: 'Review' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Courses</h1><p className="text-sm text-slate-400">{courses.length} courses</p></div>
        <button onClick={openCreate} className="btn-primary">+ Add Course</button>
      </div>
      {loading && <TableSkeleton />}

      {/* Course list */}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th className="text-white">Course</th><th className="text-white">Level</th><th className="text-white">Price</th><th className="text-white">Lessons</th><th className="text-white">Actions</th></tr></thead>
            <tbody>{courses.map(c => {
              const Ico = iconMap[c.image] || BookOpenIcon
              const minPrice = c.variants?.length ? Math.min(...c.variants.map(v => Number(v.price) || 0)) : null
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (c.color || '#3b82f6') + '20' }}>
                        <Ico size={16} style={{ color: c.color || '#3b82f6' }} />
                      </div>
                      <span className="text-white font-medium">{c.title}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-navy">{c.level}</span></td>
                  <td className="text-white">{c.isFree ? <span className="text-green-brand">Free</span> : minPrice !== null ? `₹${minPrice}` : '—'}</td>
                  <td className="text-white">{c.lessons?.length || 0}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-sm text-blue-400 cursor-pointer">Edit</button>
                      <button onClick={() => remove(c.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Step-by-step modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editing ? `Edit: ${basic.title || 'Course'}` : 'Add Course'} size="lg">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button onClick={() => step >= s.n && setStep(s.n)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s.n ? 'bg-green-brand text-white' : step > s.n ? 'bg-green-brand/20 text-green-brand' : 'bg-white/10 text-slate-500'}`}>
                {step > s.n ? '✓' : s.n}
              </button>
              <span className={`text-xs hidden sm:inline ${step === s.n ? 'text-white font-bold' : 'text-slate-500'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Course Title *</label>
              <input className="input-field" value={basic.title} onChange={e => setBasic({ ...basic, title: e.target.value })} placeholder="e.g. Physics for JEE Advanced" />
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Description</label>
              <textarea className="input-field resize-none" rows={3} value={basic.description} onChange={e => setBasic({ ...basic, description: e.target.value })} placeholder="What students will learn..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Level</label>
                <select className="input-field" value={basic.level} onChange={e => setBasic({ ...basic, level: e.target.value })}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Duration</label>
                <input className="input-field" value={basic.duration} onChange={e => setBasic({ ...basic, duration: e.target.value })} placeholder="e.g. 12 Months" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Subjects (comma separated)</label>
              <input className="input-field" value={basic.subjects} onChange={e => setBasic({ ...basic, subjects: e.target.value })} placeholder="Physics, Chemistry, Maths" />
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Thumbnail (optional)</label>
              <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
                {basic.thumbnail ? (
                  <img src={basic.thumbnail} alt="Thumbnail" className="w-full max-h-40 object-contain mx-auto rounded-lg" />
                ) : (
                  <p className="text-sm text-slate-400">{thumbUploading ? 'Uploading...' : 'Click to upload (max 10MB)'}</p>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={thumbUploading} />
              </label>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-3 text-slate-500 text-xs">or paste image URL (saves storage)</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>
              <input className="input-field" value={basic.thumbnail} onChange={e => setBasic({ ...basic, thumbnail: e.target.value })} placeholder="https://imgur.com/... or leave blank for auto" />
              {basic.thumbnail && (
                <button type="button" onClick={() => setBasic({ ...basic, thumbnail: '' })}
                  className="text-xs text-red-400 mt-1 cursor-pointer">Remove image</button>
              )}
              <p className="text-xs text-slate-500 mt-1">Tip: Paste an image URL (imgur, postimages) to save Firebase storage. Leave blank — auto from first lesson thumbnail.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Icon</label>
                <div className="flex gap-2">
                  {ICONS.map(ico => {
                    const Ico = iconMap[ico]
                    return (
                      <button key={ico} onClick={() => setBasic({ ...basic, image: ico })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 cursor-pointer transition-all ${basic.image === ico ? 'border-green-brand bg-green-brand/10' : 'border-slate-700 bg-white/5'}`}>
                        <Ico size={18} className={basic.image === ico ? 'text-green-brand' : 'text-slate-400'} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Color</label>
                <input type="color" className="input-field h-10 w-full" value={basic.color} onChange={e => setBasic({ ...basic, color: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div><p className="text-sm font-medium text-white">Free Course?</p><p className="text-xs text-slate-400">If free, students enroll at ₹0</p></div>
              <button onClick={() => setBasic({ ...basic, isFree: !basic.isFree })}
                className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${basic.isFree ? 'bg-green-brand' : 'bg-slate-600'}`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${basic.isFree ? 'left-7' : 'left-0.5'}`} />
              </button>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">Next: Pricing →</button>
          </div>
        )}

        {/* STEP 2: Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            {basic.isFree ? (
              <div className="text-center py-8">
                <p className="text-green-brand font-bold text-lg mb-2">Free Course</p>
                <p className="text-slate-400 text-sm">No pricing needed. Students enroll at ₹0.</p>
              </div>
            ) : (
              <>
                {pricing.map((p, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-slate-700 relative">
                    <div className="absolute top-2 right-2 flex gap-1">
                      {pricing.length > 1 && <button onClick={() => removePricing(i)} className="text-red-400 text-xs cursor-pointer">Remove</button>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Months</label>
                        <input type="number" className="input-field text-sm" value={p.months} onChange={e => {
                          const v = [...pricing]; v[i] = { ...v[i], months: e.target.value }; setPricing(v)
                        }} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Price (₹)</label>
                        <input type="number" className="input-field text-sm" value={p.price} onChange={e => {
                          const v = [...pricing]; v[i] = { ...v[i], price: e.target.value }; setPricing(v)
                        }} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Original Price (₹)</label>
                        <input type="number" className="input-field text-sm" value={p.originalPrice} onChange={e => {
                          const v = [...pricing]; v[i] = { ...v[i], originalPrice: e.target.value }; setPricing(v)
                        }} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Discount Label</label>
                        <input className="input-field text-sm" value={p.discount} onChange={e => {
                          const v = [...pricing]; v[i] = { ...v[i], discount: e.target.value }; setPricing(v)
                        }} placeholder="37% OFF" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Note (e.g. Most Popular)</label>
                      <input className="input-field text-sm" value={p.note} onChange={e => {
                        const v = [...pricing]; v[i] = { ...v[i], note: e.target.value }; setPricing(v)
                      }} />
                    </div>
                  </div>
                ))}
                <button onClick={addPricing} className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-green-brand transition-all cursor-pointer text-sm">
                  + Add Pricing Plan
                </button>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white cursor-pointer">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary">Next: Lessons →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Lessons */}
        {step === 3 && (
          <div className="space-y-4">
            {lessons.map((l, i) => {
              const thumb = ytThumb(l.videoUrl)
              return (
                <div key={l.id} className="bg-white/5 rounded-xl p-4 border border-slate-700 relative">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button onClick={() => moveLesson(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-30">↑</button>
                    <button onClick={() => moveLesson(i, 1)} disabled={i === lessons.length - 1} className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-30">↓</button>
                    <button onClick={() => removeLesson(i)} className="text-red-400 cursor-pointer">✕</button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 font-bold">Lesson {i + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Title</label>
                      <input className="input-field text-sm" value={l.title} onChange={e => {
                        const v = [...lessons]; v[i] = { ...v[i], title: e.target.value }; setLessons(v)
                      }} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Duration</label>
                      <input className="input-field text-sm" value={l.duration} onChange={e => {
                        const v = [...lessons]; v[i] = { ...v[i], duration: e.target.value }; setLessons(v)
                      }} placeholder="15 min" />
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">YouTube URL (paste any link)</label>
                      <input className="input-field text-sm" value={l.videoUrl} onChange={e => {
                        const v = [...lessons]; v[i] = { ...v[i], videoUrl: e.target.value }; setLessons(v)
                      }} placeholder="https://youtube.com/watch?v=..." />
                    </div>
                    {thumb && <img src={thumb} alt="" className="w-16 h-10 rounded object-cover mt-4" />}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={!!l.isFree} onChange={e => {
                        const v = [...lessons]; v[i] = { ...v[i], isFree: e.target.checked }; setLessons(v)
                      }} className="accent-green-brand" />
                      Free preview
                    </label>
                    <span className="text-xs text-slate-500">Tip: Use Unlisted YouTube videos</span>
                  </div>
                </div>
              )
            })}
            <button onClick={addLesson} className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-green-brand transition-all cursor-pointer text-sm">
              + Add Lesson
            </button>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white cursor-pointer">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 btn-primary">Next: Review →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-bold mb-2">Course Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-400">Title</div><div className="text-white">{basic.title || '—'}</div>
                <div className="text-slate-400">Level</div><div className="text-white">{basic.level}</div>
                <div className="text-slate-400">Duration</div><div className="text-white">{basic.duration}</div>
                <div className="text-slate-400">Type</div><div className={basic.isFree ? 'text-green-brand' : 'text-white'}>{basic.isFree ? 'Free' : 'Paid'}</div>
                <div className="text-slate-400">Pricing Plans</div><div className="text-white">{basic.isFree ? '—' : pricing.length}</div>
                <div className="text-slate-400">Lessons</div><div className="text-white">{lessons.length}</div>
              </div>
            </div>

            {!basic.isFree && pricing.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-2">Pricing</h3>
                {pricing.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-slate-300">{p.months}-month plan</span>
                    <span className="text-white font-bold">₹{p.price} <span className="text-slate-500 line-through text-xs">₹{p.originalPrice}</span></span>
                  </div>
                ))}
              </div>
            )}

            {lessons.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-2">Lessons</h3>
                {lessons.map((l, i) => (
                  <div key={l.id} className="flex items-center gap-2 text-sm py-1.5">
                    <span className="text-slate-500 w-5">{i + 1}.</span>
                    <span className="text-white flex-1 truncate">{l.title || 'Untitled'}</span>
                    {l.isFree && <span className="text-green-brand text-xs">Free</span>}
                    <span className="text-slate-500 text-xs">{l.duration}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white cursor-pointer">← Back</button>
              <button onClick={save} className="flex-1 btn-primary">{editing ? 'Update Course' : 'Create Course'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
