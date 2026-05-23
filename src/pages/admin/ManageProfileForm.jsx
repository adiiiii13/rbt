import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'
import { TableSkeleton } from '../../components/ui/Skeleton'

export default function ManageProfileForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    boards: ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other'],
    classes: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper'],
    timings: ['Morning Batch', 'Noon Batch', 'Evening Batch', 'Weekend Batch']
  })

  // Temporary state for adding new items
  const [newBoard, setNewBoard] = useState('')
  const [newClass, setNewClass] = useState('')
  const [newTiming, setNewTiming] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'settings', 'profileForm')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const fetchedData = docSnap.data()
          setData({
            boards: fetchedData.boards || ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other'],
            classes: fetchedData.classes || ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper'],
            timings: fetchedData.timings || ['Morning Batch', 'Noon Batch', 'Evening Batch', 'Weekend Batch']
          })
        }
      } catch (error) {
        console.error("Error fetching profile form settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const saveSettings = async (newData) => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'profileForm'), newData, { merge: true })
      setData(newData)
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error("Error saving profile form settings:", error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = (field, value, setter) => {
    if (!value.trim()) return
    const newData = { ...data, [field]: [...(data[field] || []), value.trim()] }
    saveSettings(newData)
    setter('')
  }

  const handleRemoveItem = (field, index) => {
    const newData = { ...data, [field]: data[field].filter((_, i) => i !== index) }
    saveSettings(newData)
  }

  if (loading) return <div className="p-8"><TableSkeleton /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Form Settings</h1>
          <p className="text-sm text-slate-400">Manage the dropdown options available to students during profile completion.</p>
          <p className="text-xs text-amber-200 mt-2">Note: Batches/Classes are now managed directly from the "Manage Batches / Classes" section. These settings provide options for when you create those batches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Boards Section */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Boards</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="Add new board..."
              value={newBoard}
              onChange={(e) => setNewBoard(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('boards', newBoard, setNewBoard)}
            />
            <button 
              onClick={() => handleAddItem('boards', newBoard, setNewBoard)}
              disabled={saving || !newBoard.trim()}
              className="btn-primary bg-green-brand text-white px-4"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {data.boards?.map((b, i) => (
              <li key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-200 text-sm">{b}</span>
                <button 
                  onClick={() => handleRemoveItem('boards', i)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </button>
              </li>
            ))}
            {(!data.boards || data.boards.length === 0) && <p className="text-slate-500 text-sm italic text-center py-4">No boards added</p>}
          </ul>
        </div>

        {/* Classes Section */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Classes</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="Add new class..."
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('classes', newClass, setNewClass)}
            />
            <button 
              onClick={() => handleAddItem('classes', newClass, setNewClass)}
              disabled={saving || !newClass.trim()}
              className="btn-primary bg-green-brand text-white px-4"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {data.classes?.map((c, i) => (
              <li key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-200 text-sm">{c}</span>
                <button 
                  onClick={() => handleRemoveItem('classes', i)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </button>
              </li>
            ))}
            {(!data.classes || data.classes.length === 0) && <p className="text-slate-500 text-sm italic text-center py-4">No classes added</p>}
          </ul>
        </div>

        {/* Timings Section */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Timings</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="Add new timing..."
              value={newTiming}
              onChange={(e) => setNewTiming(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('timings', newTiming, setNewTiming)}
            />
            <button 
              onClick={() => handleAddItem('timings', newTiming, setNewTiming)}
              disabled={saving || !newTiming.trim()}
              className="btn-primary bg-green-brand text-white px-4"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {data.timings?.map((t, i) => (
              <li key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-200 text-sm">{t}</span>
                <button 
                  onClick={() => handleRemoveItem('timings', i)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </button>
              </li>
            ))}
            {(!data.timings || data.timings.length === 0) && <p className="text-slate-500 text-sm italic text-center py-4">No timings added</p>}
          </ul>
        </div>

      </div>
    </div>
  )
}
