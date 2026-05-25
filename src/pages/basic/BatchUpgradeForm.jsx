import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import toast from 'react-hot-toast'

const CLASS_OPTIONS = [
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
  { value: 'dropper', label: 'Dropper / 12+' },
]

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'Other']
const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (6 AM – 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM – 4 PM)' },
  { value: 'evening', label: 'Evening (4 PM – 9 PM)' },
]
const EXAM_OPTIONS = ['JEE', 'NEET', 'Boards', 'Foundation']

// Compress image to JPEG <500KB via canvas
async function compressImage(file, maxKB = 500, maxWidth = 1600) {
  if (file.type === 'application/pdf') return file // skip PDF
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      let quality = 0.9
      const tryBlob = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('compress failed'))
            if (blob.size / 1024 <= maxKB || quality <= 0.4) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
            } else {
              quality -= 0.1
              tryBlob()
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryBlob()
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function BatchUpgradeForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: batches } = useRealtimeCollection('batches')

  const [existingRequest, setExistingRequest] = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    phone: '',
    altPhone: '',
    parentName: '',
    parentPhone: '',
    class: '',
    board: '',
    school: '',
    address: '',
    targetExam: [],
    preferredBatchTime: '',
    preferredBatchId: '',
    message: '',
  })
  const [files, setFiles] = useState({ photo: null, idProof: null, lastMarksheet: null })

  // Load existing request if any
  useEffect(() => {
    if (!user?.uid) return
    let alive = true
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'batchRequests', user.uid))
        if (alive) setExistingRequest(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      } catch (err) {
        console.error('Load batch request failed', err)
      } finally {
        if (alive) setLoadingExisting(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const toggleExam = (e) => {
    setForm((s) => ({
      ...s,
      targetExam: s.targetExam.includes(e) ? s.targetExam.filter((x) => x !== e) : [...s.targetExam, e],
    }))
  }

  const uploadFile = async (file, name) => {
    const compressed = await compressImage(file)
    const path = `students/${user.uid}/batch-${name}-${Date.now()}.${compressed.type === 'application/pdf' ? 'pdf' : 'jpg'}`
    const r = ref(storage, path)
    await uploadBytes(r, compressed)
    return await getDownloadURL(r)
  }

  const validate = () => {
    if (!form.phone || form.phone.length < 10) return 'Valid phone required'
    if (!form.parentName) return 'Parent name required'
    if (!form.parentPhone || form.parentPhone.length < 10) return 'Parent phone required'
    if (!form.class) return 'Class required'
    if (form.targetExam.length === 0) return 'Pick at least one target exam'
    if (!form.preferredBatchTime) return 'Preferred batch time required'
    if (!files.photo) return 'Student photo required'
    if (!files.idProof) return 'ID proof required'
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) return toast.error(err)
    setSubmitting(true)
    try {
      const [photoURL, idProofURL, marksheetURL] = await Promise.all([
        uploadFile(files.photo, 'photo'),
        uploadFile(files.idProof, 'idproof'),
        files.lastMarksheet ? uploadFile(files.lastMarksheet, 'marksheet') : Promise.resolve(null),
      ])

      await setDoc(doc(db, 'batchRequests', user.uid), {
        uid: user.uid,
        studentName: user.name || '',
        studentEmail: user.email || '',
        studentId: user.studentId || '',
        ...form,
        documents: {
          photo: photoURL,
          idProof: idProofURL,
          lastMarksheet: marksheetURL,
        },
        status: 'pending',
        adminNotes: '',
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'students', user.uid), { batchStatus: 'pending' })

      toast.success('Submitted. RBT team will call you within 24h.')
      navigate('/basic')
    } catch (err) {
      console.error(err)
      toast.error('Submit failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExisting) {
    return <div className="p-8 text-slate-400">Loading...</div>
  }

  // Status banners (pending/called/approved/rejected)
  if (existingRequest && ['pending', 'called', 'approved'].includes(existingRequest.status)) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className={`rounded-2xl p-6 border ${existingRequest.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${existingRequest.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {existingRequest.status === 'approved' ? '✓' : '⏳'}
            </div>
            <h2 className="text-white text-xl font-bold">
              {existingRequest.status === 'pending' && 'Request Submitted'}
              {existingRequest.status === 'called' && 'Under Review'}
              {existingRequest.status === 'approved' && 'Request Approved!'}
            </h2>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            {existingRequest.status === 'pending' && 'Your batch enrollment request is pending. Our team will call you within 24h.'}
            {existingRequest.status === 'called' && 'We have contacted you. Please visit the institution to complete enrollment.'}
            {existingRequest.status === 'approved' && 'Visit the institution to complete fee payment and start batch classes. You will be assigned a class and batch shortly.'}
          </p>
          {existingRequest.adminNotes && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Admin Note:</p>
              <p className="text-sm text-white">{existingRequest.adminNotes}</p>
            </div>
          )}
          <button onClick={() => navigate('/basic')} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (existingRequest && existingRequest.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-2xl p-6 border bg-red-500/10 border-red-500/30 mb-4">
          <h2 className="text-white text-xl font-bold mb-2">Request Rejected</h2>
          {existingRequest.adminNotes && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Reason:</p>
              <p className="text-sm text-white">{existingRequest.adminNotes}</p>
            </div>
          )}
          <button onClick={() => setExistingRequest(null)} className="mt-4 px-4 py-2 bg-green-brand hover:bg-green-600 text-white rounded-lg text-sm">Apply Again</button>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Apply for Offline Batch</h1>
        <p className="text-sm text-slate-400">Fill this form. Our team will call you within 24h. Pay fees at institution after approval.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 bg-[#111111] border border-slate-800 rounded-2xl p-6">
        {/* Student Contact */}
        <section>
          <h3 className="text-white font-bold mb-3">Your Contact</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="input-field" type="tel" placeholder="Your Phone *" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
            <input className="input-field" type="tel" placeholder="Alt Phone (optional)" value={form.altPhone} onChange={(e) => setField('altPhone', e.target.value)} />
          </div>
        </section>

        {/* Parent */}
        <section>
          <h3 className="text-white font-bold mb-3">Parent / Guardian</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="input-field" type="text" placeholder="Parent Name *" value={form.parentName} onChange={(e) => setField('parentName', e.target.value)} required />
            <input className="input-field" type="tel" placeholder="Parent Phone *" value={form.parentPhone} onChange={(e) => setField('parentPhone', e.target.value)} required />
          </div>
        </section>

        {/* Academic */}
        <section>
          <h3 className="text-white font-bold mb-3">Academic Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <select className="input-field" value={form.class} onChange={(e) => setField('class', e.target.value)} required>
              <option value="">Select Class *</option>
              {CLASS_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="input-field" value={form.board} onChange={(e) => setField('board', e.target.value)}>
              <option value="">Select Board</option>
              {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input className="input-field sm:col-span-2" type="text" placeholder="School / College Name" value={form.school} onChange={(e) => setField('school', e.target.value)} />
            <textarea className="input-field sm:col-span-2" placeholder="Full Address" value={form.address} onChange={(e) => setField('address', e.target.value)} rows={2} />
          </div>
        </section>

        {/* Target exam */}
        <section>
          <h3 className="text-white font-bold mb-3">Target Exam *</h3>
          <div className="flex flex-wrap gap-2">
            {EXAM_OPTIONS.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => toggleExam(ex)}
                className={`px-4 py-2 rounded-lg text-sm border transition ${form.targetExam.includes(ex) ? 'bg-green-brand/20 border-green-brand text-green-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Batch preference */}
        <section>
          <h3 className="text-white font-bold mb-3">Batch Preference</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <select className="input-field" value={form.preferredBatchTime} onChange={(e) => setField('preferredBatchTime', e.target.value)} required>
              <option value="">Preferred Time *</option>
              {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="input-field" value={form.preferredBatchId} onChange={(e) => setField('preferredBatchId', e.target.value)}>
              <option value="">Preferred Batch (optional)</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h3 className="text-white font-bold mb-3">Documents *</h3>
          <p className="text-xs text-slate-500 mb-3">Images auto-compressed to fit. Max 5MB each.</p>
          <div className="space-y-3">
            <FileInput label="Student Photo *" file={files.photo} onChange={(f) => setFiles((s) => ({ ...s, photo: f }))} accept="image/*" />
            <FileInput label="ID Proof (Aadhaar / School ID) *" file={files.idProof} onChange={(f) => setFiles((s) => ({ ...s, idProof: f }))} accept="image/*,.pdf" />
            <FileInput label="Last Marksheet (optional)" file={files.lastMarksheet} onChange={(f) => setFiles((s) => ({ ...s, lastMarksheet: f }))} accept="image/*,.pdf" />
          </div>
        </section>

        {/* Message */}
        <section>
          <textarea className="input-field w-full" placeholder="Anything else? (optional)" value={form.message} onChange={(e) => setField('message', e.target.value)} rows={3} />
        </section>

        <button type="submit" disabled={submitting} className="btn-primary w-full bg-green-brand hover:bg-green-600 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}

function FileInput({ label, file, onChange, accept }) {
  return (
    <label className="block bg-white/5 border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-green-brand/40 transition">
      <span className="text-sm text-white block mb-1">{label}</span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="text-xs text-slate-400"
      />
      {file && <span className="block mt-1 text-xs text-emerald-400">✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)</span>}
    </label>
  )
}
