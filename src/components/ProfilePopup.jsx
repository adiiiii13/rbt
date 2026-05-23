import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ProfilePopup() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ className: '', batch: '', board: 'CBSE', phone: '', school: '', parentName: '', parentPhone: '' })
  const [saving, setSaving] = useState(false)
  const [options, setOptions] = useState({
    classes: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper'],
    boards: ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other'],
    batches: ['Morning Batch', 'Evening Batch', 'Weekend Batch', 'Online Batch', 'Crash Course', 'Dropper Batch']
  })

  // Fetch dynamic settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profileForm')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setOptions(docSnap.data())
        }
      } catch (err) {
        console.error("Failed to load profile form settings", err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'student' || (!user.batch && user.batchStatus !== 'pending')) return
    // Show if profile not filled
    const hasProfile = user.profileCompleted
    if (!hasProfile) setShow(true)
    
    // Auto-fill existing details
    setForm({
      className: user.className || '',
      batch: user.batchName || user.batch || '',
      board: user.board || 'CBSE',
      phone: user.phone || '',
      school: user.school || '',
      parentName: user.parentName || '',
      parentPhone: user.parentPhone || '',
    })

    const handleOpen = () => setShow(true)
    window.addEventListener('openProfilePopup', handleOpen)
    return () => window.removeEventListener('openProfilePopup', handleOpen)
  }, [user])

  const save = async () => {
    setSaving(true)
    const isComplete = !!(form.className && form.batch && form.phone)
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        className: form.className,
        batchName: form.batch, // using batchName for user-selected string, `batch` bool is used for auth role
        board: form.board,
        phone: form.phone,
        school: form.school,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        profileCompleted: isComplete,
        ...(isComplete ? { profileCompletedAt: new Date().toISOString() } : {})
      })
      if (isComplete) {
        toast.success('Profile completed! All sections unlocked.')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.success('Progress saved!')
      }
      setShow(false)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!show || !user) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-300 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="w-full max-w-lg bg-[#111111] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="h-2 bg-linear-to-r from-green-brand to-blue-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5 relative">
              <div className="w-12 h-12 rounded-xl bg-green-brand/15 flex items-center justify-center text-green-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
                <p className="text-sm text-slate-400">Required to unlock full dashboard access</p>
              </div>
              <button onClick={() => setShow(false)} className="absolute right-0 top-0 text-slate-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Class *</label>
                  <select className="input-field" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })}>
                    <option value="">Select class</option>
                    {options.classes.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Board</label>
                  <select className="input-field" value={form.board} onChange={e => setForm({ ...form, board: e.target.value })}>
                    {options.boards.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Batch *</label>
                <select className="input-field" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>
                  <option value="">Select batch</option>
                  {options.batches.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">School / College</label>
                <input className="input-field" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} placeholder="Name of your school" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Your Phone *</label>
                <input className="input-field" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 uppercase font-bold mb-3">Parent Details (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Parent Name</label>
                    <input className="input-field" value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Parent Phone</label>
                    <input className="input-field" type="tel" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={save} disabled={saving}
              className="w-full mt-5 bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all">
              {saving ? 'Saving...' : (form.className && form.batch && form.phone) ? 'Save & Unlock Access' : 'Save Progress'}
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">All required (*) fields must be filled to unlock full access</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
