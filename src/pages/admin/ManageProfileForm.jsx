import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'
import { TableSkeleton } from '../../components/ui/Skeleton'

const DEFAULT_FIELDS = [
  { id: 'batchId', label: 'Batch / Class', type: 'batchSelect', required: true },
  { id: 'board', label: 'Board', type: 'boardSelect', required: false },
  { id: 'school', label: 'School / College', type: 'text', required: false },
  { id: 'phone', label: 'Your Phone', type: 'tel', required: true },
  { id: 'parentName', label: 'Parent Name', type: 'text', required: false },
  { id: 'parentPhone', label: 'Parent Phone', type: 'tel', required: false }
];

export default function ManageProfileForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    boards: ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other'],
    classes: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper'],
    timings: ['Morning Batch', 'Noon Batch', 'Evening Batch', 'Weekend Batch'],
    fields: DEFAULT_FIELDS
  })

  // Temporary state for adding new items
  const [newBoard, setNewBoard] = useState('')
  const [newClass, setNewClass] = useState('')
  const [newTiming, setNewTiming] = useState('')
  const [newField, setNewField] = useState({ id: '', label: '', type: 'text', required: false })

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
            timings: fetchedData.timings || ['Morning Batch', 'Noon Batch', 'Evening Batch', 'Weekend Batch'],
            fields: fetchedData.fields || DEFAULT_FIELDS
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

  const handleAddField = () => {
    if (!newField.label || !newField.id) {
      toast.error("Label and ID are required")
      return;
    }
    if (data.fields.some(f => f.id === newField.id)) {
      toast.error("A field with this ID already exists")
      return;
    }
    const newData = { ...data, fields: [...(data.fields || []), { ...newField }] }
    saveSettings(newData)
    setNewField({ id: '', label: '', type: 'text', required: false })
  }

  const handleRemoveField = (index) => {
    const newData = { ...data, fields: data.fields.filter((_, i) => i !== index) }
    saveSettings(newData)
  }

  const handleMoveField = (index, direction) => {
    const newFields = [...data.fields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
    } else {
      return;
    }
    saveSettings({ ...data, fields: newFields });
  }

  const generateId = (label) => {
    return label.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  if (loading) return <div className="p-8"><TableSkeleton /></div>

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Form Settings</h1>
          <p className="text-sm text-slate-400">Completely customize the fields students must fill out during profile completion.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Fields Editor */}
        <div className="lg:col-span-2 bg-[#111111] rounded-2xl border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Dynamic Fields</h2>
          
          <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Add New Field</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Field Label</label>
                <input 
                  type="text" 
                  className="input-field w-full text-sm" 
                  placeholder="e.g. Address"
                  value={newField.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNewField({ ...newField, label, id: generateId(label) })
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Input Type</label>
                <select className="input-field w-full text-sm" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})}>
                  <option value="text">Text</option>
                  <option value="tel">Phone (tel)</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="batchSelect">Batch Selector</option>
                  <option value="boardSelect">Board Selector</option>
                </select>
              </div>
              <div className="flex items-center justify-center h-10 mb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-green-brand focus:ring-green-brand/20" 
                    checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} />
                  <span className="text-sm text-slate-300">Required</span>
                </label>
              </div>
              <div>
                <button onClick={handleAddField} disabled={saving || !newField.label} className="btn-primary w-full text-sm py-2.5">
                  Add Field
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Internal ID will be generated automatically: <span className="font-mono text-emerald-400">{newField.id || '...'}</span></p>
          </div>

          <div className="space-y-3">
            {data.fields?.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleMoveField(i, 'up')} disabled={i === 0} className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button onClick={() => handleMoveField(i, 'down')} disabled={i === data.fields.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{f.label}</span>
                      {f.required && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                      <span>Type: <span className="text-blue-400">{f.type}</span></span>
                      <span>ID: <span className="font-mono text-emerald-400">{f.id}</span></span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemoveField(i)} className="text-red-400 hover:text-red-300 p-2 bg-red-400/10 rounded-lg transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
            {(!data.fields || data.fields.length === 0) && <p className="text-slate-500 text-sm italic text-center py-8">No fields added</p>}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            Live Preview
          </h2>
          <div className="bg-[#0a0a0a] border border-slate-800/50 rounded-xl p-5 flex-1 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-brand/15 flex items-center justify-center text-green-brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Complete Your Profile</h2>
                <p className="text-[10px] text-slate-400">Required to unlock full dashboard access</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.fields?.map(f => (
                <div key={f.id}>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">
                    {f.label} {f.required && '*'}
                  </label>
                  {f.type === 'batchSelect' ? (
                    <select className="input-field w-full text-sm py-1.5" disabled>
                      <option>Select Batch / Class</option>
                      <option>Mock Batch 1</option>
                      <option>Mock Batch 2</option>
                    </select>
                  ) : f.type === 'boardSelect' ? (
                    <select className="input-field w-full text-sm py-1.5" disabled>
                      <option>Select Board</option>
                      {data.boards.map(b => <option key={b}>{b}</option>)}
                    </select>
                  ) : (
                    <input className="input-field w-full text-sm py-1.5" type={f.type} disabled placeholder={`Enter ${f.label}`} />
                  )}
                </div>
              ))}
              <button disabled className="w-full mt-3 bg-green-brand/50 text-white/50 font-bold py-2 rounded-lg text-sm">
                Save Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Dropdown Lists Management</h2>
      <p className="text-xs text-amber-200 mb-6">Note: Batches/Classes are now managed directly from the "Manage Batches / Classes" section. These settings provide options for when you create those batches.</p>
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
