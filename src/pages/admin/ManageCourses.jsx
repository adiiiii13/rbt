import { TableSkeleton } from '../../components/ui/Skeleton'
import { useState } from 'react'
import { deleteItemSmart } from '../../lib/contentApi'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers'
import { defaultCourses } from '../../data/courses'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon } from '../../components/Icons'
import ExportButton from '../../components/ExportButton'

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
  
  const { data: testsRaw } = useRealtimeCollection('mock_tests', { fallback: [] })
  const { data: seriesRaw } = useRealtimeCollection('test_series', { fallback: [] })
  const { data: batches } = useRealtimeCollection('batches', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [step, setStep] = useState(1) // 1-4

  // Step 1: Basic
  const [basic, setBasic] = useState({ title: '', description: '', subjects: '', level: 'Foundation', durationValue: '12', durationUnit: 'Months', thumbnail: '', image: 'BookOpen', color: '#3b82f6', isFree: false, courseType: 'basic', batchId: '' })

  // Step 2: Pricing
  const [pricing, setPricing] = useState([{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: 'Most Popular' }])

  // Step 3: Curriculum (Modules & Items)
  const [modules, setModules] = useState([])

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
    setBasic({ title: '', description: '', subjects: '', level: 'Foundation', durationValue: '12', durationUnit: 'Months', thumbnail: '', image: 'BookOpen', color: '#3b82f6', isFree: false, courseType: 'basic', batchId: '' })
    setPricing([{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: 'Most Popular' }])
    setModules([])
  }

  const openCreate = () => { setEditing(null); reset(); setModal(true) }

  const openEdit = (c) => {
    setEditing(c)
    let dVal = '12';
    let dUnit = 'Months';
    if (c.duration) {
      if (c.duration === 'Lifetime') { dVal = ''; dUnit = 'Lifetime'; }
      else {
        const parts = c.duration.split(' ');
        if (parts.length >= 2) { dVal = parts[0]; dUnit = parts[1]; }
        else { dVal = c.duration; }
      }
    }

    setBasic({
      title: c.title || '', description: c.description || '',
      subjects: Array.isArray(c.subjects) ? c.subjects.join(', ') : '',
      level: c.level || 'Foundation', durationValue: dVal, durationUnit: dUnit,
      thumbnail: c.thumbnail || '', image: c.image || 'BookOpen',
      color: c.color || '#3b82f6', isFree: !!c.isFree,
      courseType: c.courseType || 'basic', batchId: c.batchId || '',
    })
    setPricing(c.variants?.length ? c.variants : [{ months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: '' }])
    
    // Convert old lessons array to a default module if needed
    if (c.modules?.length) {
      setModules(c.modules)
    } else if (c.lessons?.length) {
      setModules([{ id: 'mod_legacy', title: 'Course Content', items: c.lessons.map(l => ({ ...l, type: 'video', data: l.videoUrl })) }])
    } else {
      setModules([])
    }
    setStep(1)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null); reset() }

  const handlePricingChange = (i, field, val) => {
    const v = [...pricing];
    v[i] = { ...v[i], [field]: val };
    
    const orig = Number(v[i].originalPrice);
    const price = Number(v[i].price);
    const extractDisc = (str) => { const m = String(str||'').match(/(\d+)/); return m ? Number(m[1]) : 0; };
    
    if (field === 'price') {
      if (orig > 0 && price > 0 && orig >= price) {
        const d = Math.round(((orig - price) / orig) * 100);
        v[i].discount = d > 0 ? `${d}% OFF` : '';
      }
    } else if (field === 'originalPrice') {
      const d = extractDisc(v[i].discount);
      if (d > 0 && orig > 0) {
        v[i].price = Math.round(orig - (orig * d / 100)).toString();
      } else if (orig > 0 && price > 0 && orig >= price) {
        const newD = Math.round(((orig - price) / orig) * 100);
        v[i].discount = newD > 0 ? `${newD}% OFF` : '';
      }
    } else if (field === 'discount') {
      const d = extractDisc(val);
      if (d > 0 && orig > 0) {
        v[i].price = Math.round(orig - (orig * d / 100)).toString();
      }
    }
    setPricing(v);
  }

  const handleDiscountBlur = (i) => {
    const v = [...pricing];
    const m = String(v[i].discount || '').match(/(\d+)/);
    if (m && !String(v[i].discount).includes('%')) {
      v[i].discount = `${m[1]}% OFF`;
      setPricing(v);
    }
  }

  const addPricing = () => setPricing(p => [...p, { months: 1, price: 1999, originalPrice: 2999, discount: '', note: '' }])
  const removePricing = (i) => setPricing(p => p.filter((_, idx) => idx !== i))

  const addModule = () => setModules(m => [...m, { id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, title: 'New Section', description: '', items: [] }])
  const removeModule = (mIdx) => setModules(m => m.filter((_, i) => i !== mIdx))
  const moveModule = (i, dir) => setModules(m => { const a = [...m]; const j = i + dir; if(j<0||j>=a.length) return m; [a[i],a[j]]=[a[j],a[i]]; return a })
  
  const addItem = (mIdx, type) => setModules(m => {
    const a = [...m]
    a[mIdx].items.push({ id: `itm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, type, title: '', description: '', data: '', duration: '', isFree: false })
    return a
  })
  const removeItem = (mIdx, iIdx) => setModules(m => {
    const a = [...m]; a[mIdx].items = a[mIdx].items.filter((_, i) => i !== iIdx); return a
  })
  const moveItem = (mIdx, iIdx, dir) => setModules(m => {
    const a = [...m]; const items = [...a[mIdx].items]; const j = iIdx + dir
    if (j<0||j>=items.length) return m; [items[iIdx],items[j]]=[items[j],items[iIdx]]
    a[mIdx].items = items; return a
  })

  const save = async () => {
    if (!basic.title.trim()) { toast.error('Title required'); return }
    const subjectsArr = basic.subjects.split(',').map(s => s.trim()).filter(Boolean)
    
    // Auto-thumb from first video item if available
    let firstVideoUrl = ''
    for (const m of modules) { const v = m.items.find(i => i.type === 'video'); if (v?.data) { firstVideoUrl = v.data; break } }
    const autoThumb = !basic.thumbnail ? ytThumb(firstVideoUrl) : ''
    
    const finalDuration = basic.durationUnit === 'Lifetime' ? 'Lifetime' : `${basic.durationValue} ${basic.durationUnit}`
    
    const payload = {
      ...basic, subjects: subjectsArr, thumbnail: basic.thumbnail || autoThumb,
      duration: finalDuration,
      isFree: basic.isFree,
      courseType: 'basic',
      batchId: basic.batchId || null,
      variants: pricing.map(v => ({ ...v, months: Number(v.months), price: Number(v.price), originalPrice: Number(v.originalPrice) })),
      modules: modules.map((m, i) => ({ ...m, order: i + 1, items: m.items.map((itm, j) => ({ ...itm, order: j + 1 })) })),
      lessons: [] // Clear old format
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

  const filteredCourses = courses

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Courses</h1><p className="text-sm text-slate-400">{filteredCourses.length} courses</p></div>
        <div className="flex gap-2">
          <ExportButton data={filteredCourses} filename="courses" columns={[
            { key: 'title', label: 'Title' },
            { key: 'level', label: 'Level' },
            { key: 'duration', label: 'Duration' },
            { key: 'subjects', label: 'Subjects' },
            { key: 'isFree', label: 'Free' },
            { key: 'variants', label: 'Pricing Plans', format: (v) => Array.isArray(v) ? v.map(x => `${x.months}mo:₹${x.price}`).join(' | ') : '' },
            { key: 'modules', label: 'Modules Count', format: (v) => Array.isArray(v) ? v.length : 0 },
            { key: 'batchId', label: 'Assigned Batch' },
            { key: 'description', label: 'Description' },
          ]} />
          <button onClick={openCreate} className="btn-primary">+ Add Course</button>
        </div>
      </div>

      {loading && <TableSkeleton />}

      {/* Course list */}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th className="text-white">Course</th><th className="text-white">Level</th><th className="text-white">Price</th><th className="text-white">Lessons</th><th className="text-white">Actions</th></tr></thead>
            <tbody>{filteredCourses.map(c => {
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
                  <td className="text-white">{c.modules ? c.modules.length : (c.lessons?.length || 0)}</td>
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
                <select className="input-field mb-2" value={LEVELS.includes(basic.level) ? basic.level : 'Other'} onChange={e => {
                  if (e.target.value === 'Other') {
                    setBasic({ ...basic, level: '' })
                  } else {
                    setBasic({ ...basic, level: e.target.value })
                  }
                }}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="Other">Other (Custom)</option>
                </select>
                {!LEVELS.includes(basic.level) && (
                  <input className="input-field" value={basic.level} onChange={e => setBasic({ ...basic, level: e.target.value })} placeholder="Type custom level..." />
                )}
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Duration</label>
                <div className="flex gap-2">
                  {basic.durationUnit !== 'Lifetime' && (
                    <input type="number" className="input-field w-1/2" value={basic.durationValue} onChange={e => setBasic({ ...basic, durationValue: e.target.value })} placeholder="e.g. 12" />
                  )}
                  <select className={`input-field ${basic.durationUnit === 'Lifetime' ? 'w-full' : 'w-1/2'}`} value={basic.durationUnit} onChange={e => setBasic({ ...basic, durationUnit: e.target.value })}>
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Subjects (comma separated)</label>
              <input className="input-field" value={basic.subjects} onChange={e => setBasic({ ...basic, subjects: e.target.value })} placeholder="Physics, Chemistry, Maths" />
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Assign to Batch (Optional)</label>
              <select className="input-field" value={basic.batchId} onChange={e => setBasic({ ...basic, batchId: e.target.value })}>
                <option value="">-- No Batch Assigned --</option>
                {batches?.map(b => (
                  <option key={b.id} value={b.id}>{b.name} {b.classId ? `(${b.classId})` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">If assigned, only students in this batch will automatically get access, or it can be used for batch-specific reporting.</p>
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
                        <input type="number" className="input-field text-sm" value={p.price} onChange={e => handlePricingChange(i, 'price', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Original Price (₹)</label>
                        <input type="number" className="input-field text-sm" value={p.originalPrice} onChange={e => handlePricingChange(i, 'originalPrice', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Discount Label</label>
                        <input className="input-field text-sm" value={p.discount} onChange={e => handlePricingChange(i, 'discount', e.target.value)} onBlur={() => handleDiscountBlur(i)} placeholder="37% OFF" />
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

            {editing?.id && (testsRaw.filter(t => t.visibilityCourseIds?.includes(editing.id)).length > 0 || seriesRaw.filter(s => s.visibilityCourseIds?.includes(editing.id)).length > 0) && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <span>ℹ️</span> Included Paid Tests & Series (Bundle Value)
                </h4>
                <p className="text-sm text-slate-300 mb-3">
                  This course is linked to the following tests/series. Consider their individual prices when setting the course price above.
                </p>
                <div className="space-y-2">
                  {testsRaw.filter(t => t.visibilityCourseIds?.includes(editing.id)).map(t => (
                    <div key={t.id} className="flex justify-between text-sm bg-black/20 p-2 rounded border border-white/5">
                      <span className="text-white">{t.title} <span className="text-[10px] bg-slate-800 px-1 py-0.5 rounded ml-1">TEST</span></span>
                      <span className="text-slate-400 font-medium">₹{t.price || 0}</span>
                    </div>
                  ))}
                  {seriesRaw.filter(s => s.visibilityCourseIds?.includes(editing.id)).map(s => (
                    <div key={s.id} className="flex justify-between text-sm bg-black/20 p-2 rounded border border-white/5">
                      <span className="text-white">{s.title} <span className="text-[10px] bg-blue-900 px-1 py-0.5 rounded ml-1">SERIES</span></span>
                      <span className="text-slate-400 font-medium">₹{s.price || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white cursor-pointer">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary">Next: Lessons →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Curriculum (Modules & Items) */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">Build your course curriculum. Add modules (sections) and put content (videos, PDFs, text, links) inside them.</p>
            
            {modules.map((m, mIdx) => (
              <div key={m.id} className="bg-white/5 rounded-2xl p-5 border border-slate-700 relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button onClick={() => moveModule(mIdx, -1)} disabled={mIdx === 0} className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-30">↑</button>
                  <button onClick={() => moveModule(mIdx, 1)} disabled={mIdx === modules.length - 1} className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-30">↓</button>
                  <button onClick={() => removeModule(mIdx)} className="text-red-400 cursor-pointer ml-2">✕</button>
                </div>
                
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-800 text-xs flex items-center justify-center text-slate-400">{mIdx + 1}</span>
                  Module
                </h4>
                
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Module Title *</label>
                    <input className="input-field text-sm bg-black/20" value={m.title} onChange={e => {
                      const v = [...modules]; v[mIdx] = { ...v[mIdx], title: e.target.value }; setModules(v)
                    }} placeholder="e.g. Chapter 1: Introduction" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Description (Optional)</label>
                    <input className="input-field text-sm bg-black/20" value={m.description} onChange={e => {
                      const v = [...modules]; v[mIdx] = { ...v[mIdx], description: e.target.value }; setModules(v)
                    }} placeholder="What this module covers..." />
                  </div>
                </div>

                {/* Items within Module */}
                <div className="ml-4 pl-4 border-l-2 border-slate-700 space-y-4">
                  {m.items.map((itm, iIdx) => {
                    const thumb = itm.type === 'video' ? ytThumb(itm.data) : null
                    return (
                      <div key={itm.id} className="bg-[#111111] rounded-xl p-4 border border-slate-800 relative">
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button onClick={() => moveItem(mIdx, iIdx, -1)} disabled={iIdx === 0} className="text-slate-500 hover:text-white cursor-pointer disabled:opacity-30">↑</button>
                          <button onClick={() => moveItem(mIdx, iIdx, 1)} disabled={iIdx === m.items.length - 1} className="text-slate-500 hover:text-white cursor-pointer disabled:opacity-30">↓</button>
                          <button onClick={() => removeItem(mIdx, iIdx)} className="text-red-400 cursor-pointer ml-2">✕</button>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                            ${itm.type==='video' ? 'bg-blue-500/20 text-blue-400' : 
                              itm.type==='pdf' ? 'bg-red-500/20 text-red-400' : 
                              itm.type==='audio' ? 'bg-amber-500/20 text-amber-400' : 
                              itm.type==='text' ? 'bg-green-brand/20 text-green-brand' : 'bg-purple-500/20 text-purple-400'}`}>
                            {itm.type}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">Item {iIdx + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Title *</label>
                            <input className="input-field text-sm" value={itm.title} onChange={e => {
                              const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, title: e.target.value }; setModules(v)
                            }} placeholder="Content title" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Duration (e.g. 15 min)</label>
                            <input className="input-field text-sm" value={itm.duration} onChange={e => {
                              const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, duration: e.target.value }; setModules(v)
                            }} />
                          </div>
                        </div>

                        {(itm.type === 'video' || itm.type === 'pdf' || itm.type === 'audio') && (
                          <div className="mb-3">
                            <label className="text-xs text-slate-400 block mb-1">{itm.type === 'video' ? 'Video URL / File' : itm.type === 'pdf' ? 'PDF URL / File' : 'Audio URL / File'}</label>
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                              <div className="flex-1 flex gap-2 items-center relative">
                                <input className="input-field text-sm flex-1 pr-24" value={itm.data} onChange={e => {
                                  const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, data: e.target.value }; setModules(v)
                                }} placeholder={`Paste ${itm.type.toUpperCase()} link here...`} />
                                
                                <div className="absolute right-1 top-1 bottom-1 flex items-center">
                                  <label className="px-3 h-full rounded text-[10px] font-bold uppercase tracking-wide bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-700 hover:border-green-brand flex items-center justify-center">
                                    {itm.uploading ? '...' : 'Upload'}
                                    <input type="file" accept={itm.type === 'pdf' ? 'application/pdf' : itm.type === 'video' ? 'video/*' : 'audio/*'} className="hidden" 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 100 * 1024 * 1024) { toast.error('Max 100MB'); return; }
                                        const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, uploading: true }; setModules(v);
                                        try {
                                          const path = `public/course_files/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
                                          const url = await uploadFile(path, file);
                                          const v2 = [...modules]; v2[mIdx].items[iIdx] = { ...v2[mIdx].items[iIdx], data: url, uploading: false }; setModules(v2);
                                          toast.success('File uploaded');
                                        } catch(err) {
                                          toast.error(err.message);
                                          const v2 = [...modules]; v2[mIdx].items[iIdx] = { ...v2[mIdx].items[iIdx], uploading: false }; setModules(v2);
                                        }
                                      }}
                                      disabled={itm.uploading} />
                                  </label>
                                </div>
                              </div>
                              {itm.type === 'video' && thumb && <img src={thumb} alt="" className="w-16 h-10 rounded object-cover" />}
                            </div>
                          </div>
                        )}

                        {itm.type === 'link' && (
                          <div className="mb-3">
                            <label className="text-xs text-slate-400 block mb-1">External Link</label>
                            <input className="input-field text-sm" value={itm.data} onChange={e => {
                              const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, data: e.target.value }; setModules(v)
                            }} placeholder="https://..." />
                          </div>
                        )}

                        {itm.type === 'text' && (
                          <div className="mb-3">
                            <label className="text-xs text-slate-400 block mb-1">Text Content / Instructions</label>
                            <textarea className="input-field text-sm resize-none" rows={4} value={itm.data} onChange={e => {
                              const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, data: e.target.value }; setModules(v)
                            }} placeholder="Write your instructions or notes here..." />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={!!itm.isFree} onChange={e => {
                              const v = [...modules]; v[mIdx].items[iIdx] = { ...itm, isFree: e.target.checked }; setModules(v)
                            }} className="accent-green-brand" />
                            Free preview
                          </label>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => addItem(mIdx, 'video')} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-colors cursor-pointer">+ Video</button>
                    <button onClick={() => addItem(mIdx, 'pdf')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors cursor-pointer">+ PDF</button>
                    <button onClick={() => addItem(mIdx, 'audio')} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors cursor-pointer">+ Audio</button>
                    <button onClick={() => addItem(mIdx, 'text')} className="px-3 py-1.5 rounded-lg bg-green-brand/10 text-green-brand hover:bg-green-brand/20 text-xs font-bold transition-colors cursor-pointer">+ Text Note</button>
                    <button onClick={() => addItem(mIdx, 'link')} className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-colors cursor-pointer">+ Link</button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addModule} className="w-full py-4 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-green-brand hover:bg-green-brand/5 transition-all cursor-pointer font-bold flex flex-col items-center gap-1">
              <span className="text-xl">+</span>
              <span>Add Module</span>
            </button>
            <div className="flex gap-3 mt-8">
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
                <div className="text-slate-400">Modules</div><div className="text-white">{modules.length}</div>
                <div className="text-slate-400">Total Items</div><div className="text-white">{modules.reduce((acc, m) => acc + m.items.length, 0)}</div>
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

            {modules.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-2">Curriculum</h3>
                <div className="space-y-3">
                  {modules.map((m, i) => (
                    <div key={m.id}>
                      <div className="text-sm font-bold text-slate-300 mb-1">{i + 1}. {m.title || 'Untitled Module'}</div>
                      <div className="ml-3 pl-3 border-l border-slate-700 space-y-1">
                        {m.items.map((itm, j) => (
                          <div key={itm.id} className="flex items-center gap-2 text-sm py-0.5">
                            <span className="text-slate-500 w-4 text-xs">{j + 1}.</span>
                            <span className="text-white flex-1 truncate">{itm.title || 'Untitled Item'}</span>
                            <span className="text-slate-500 text-[10px] uppercase">{itm.type}</span>
                            {itm.isFree && <span className="text-green-brand text-[10px]">FREE</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
