import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const DEFAULT_FIELDS = [
  { id: 'board', label: 'Board', type: 'boardSelect', required: false },
  { id: 'school', label: 'School / College', type: 'text', required: false },
  { id: 'phone', label: 'Your Phone', type: 'tel', required: true },
  { id: 'parentName', label: 'Parent Name', type: 'text', required: false },
  { id: 'parentPhone', label: 'Parent Phone', type: 'tel', required: false }
];

export default function ProfilePopup() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState([])
  const [options, setOptions] = useState({
    boards: ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other']
  })
  const [batches, setBatches] = useState([])
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Fetch dynamic settings and batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'settings', 'profileForm')
        const docSnap = await getDoc(docRef)
        let loadedFields = DEFAULT_FIELDS
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.boards) setOptions({ boards: data.boards })
          if (data.fields) loadedFields = data.fields
        }
        setFields(loadedFields)
        
        const batchesSnap = await getDocs(collection(db, 'batches'))
        const batchesList = batchesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setBatches(batchesList)
      } catch (err) {
        console.error("Failed to load profile form settings", err)
        setFields(DEFAULT_FIELDS)
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    // Show if profile not filled
    const hasProfile = user.profileCompleted
    if (!hasProfile) setShow(true)
    
    const handleOpen = () => setShow(true)
    window.addEventListener('openProfilePopup', handleOpen)
    return () => window.removeEventListener('openProfilePopup', handleOpen)
  }, [user])

  // Initialize form when fields or user changes
  useEffect(() => {
    if (fields.length > 0 && user) {
      const initialForm = {}
      fields.forEach(f => {
        initialForm[f.id] = user[f.id] || ''
      })
      // Set defaults for selects if empty
      if (initialForm.board === '' && options.boards.length > 0) {
        initialForm.board = options.boards[0]
      }
      setForm(initialForm)
    }
  }, [fields, user, options.boards])

  const save = async () => {
    setSaving(true)
    
    // Validation
    const missingFields = fields.filter(f => f.required && !form[f.id])
    const isComplete = missingFields.length === 0
    
    const selectedBatch = batches.find(b => b.id === form.batchId)
    
    try {
      const updateData = {
        ...form,
        profileCompleted: isComplete,
        ...(isComplete ? { profileCompletedAt: new Date().toISOString() } : {})
      }
      // Map legacy fields that might still be relied upon
      if (selectedBatch) {
         updateData.batchName = selectedBatch.name
      }

      await updateDoc(doc(db, 'students', user.uid), updateData)
      
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

  // Check if all required fields are filled to show dynamic save button text
  const isAllRequiredFilled = fields.every(f => !f.required || !!form[f.id])

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

            {loadingSettings ? (
               <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-green-brand border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {fields.map(f => (
                  <div key={f.id}>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">
                      {f.label} {f.required && '*'}
                    </label>
                    {f.type === 'batchSelect' ? (
                      <select className="input-field w-full" value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })}>
                        <option value="">Select Batch / Class</option>
                        {batches.map(b => {
                          const timingsStr = (b.timings || (b.timing ? [b.timing] : [])).join(', ');
                          return <option key={b.id} value={b.id}>{b.className || b.name}{timingsStr ? ` — ${timingsStr}` : ''}</option>;
                        })}
                      </select>
                    ) : f.type === 'boardSelect' ? (
                      <select className="input-field w-full" value={form[f.id] || ''} onChange={e => setForm({ ...form, [f.id]: e.target.value })}>
                        <option value="">Select Board</option>
                        {options.boards.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    ) : (
                      <input 
                        className="input-field w-full" 
                        type={f.type} 
                        value={form[f.id] || ''} 
                        onChange={e => setForm({ ...form, [f.id]: e.target.value })} 
                        placeholder={`Enter ${f.label}`} 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loadingSettings && (
              <>
                <button onClick={save} disabled={saving}
                  className="w-full mt-5 bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all">
                  {saving ? 'Saving...' : isAllRequiredFilled ? 'Save & Unlock Access' : 'Save Progress'}
                </button>
                <p className="text-xs text-slate-500 text-center mt-3">All required (*) fields must be filled to unlock full access</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
