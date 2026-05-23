import { useState, useMemo } from 'react'
import { getCollectionWhere, addDocument } from '../lib/firebaseHelpers'
import { generateInvoiceNumber, formatCurrency } from '../lib/invoice'
import Modal from './Modal'
import toast from 'react-hot-toast'

const emptyForm = { studentUid: '', studentName: '', studentEmail: '', courseName: '', description: '', amount: '', dueDate: '' }

export default function CreateInvoiceModal({ isOpen, onClose, students, invoicesCount }) {
  const [form, setForm] = useState(emptyForm)
  const [invoiceTab, setInvoiceTab] = useState('basic') // 'basic' or 'batch'
  const [studentEnrolledItems, setStudentEnrolledItems] = useState([])
  const [batchSelections, setBatchSelections] = useState({})
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q))
  }, [students, search])

  const loadStudentItems = async (uid) => {
    try {
      const student = students.find(s => s.id === uid || s.uid === uid)
      if (!student) return
      
      const items = []
      if (student.assignedBatchName) {
        items.push({ id: `batch_${student.assignedBatchId}`, name: student.assignedBatchName, type: 'Batch' })
      }
      if (student.course) {
        items.push({ id: `course_manual_${student.course}`, name: student.course, type: 'Course' })
      }
      
      await getCollectionWhere('enrollments', 'uid', '==', uid) // just checking if works
      
      setStudentEnrolledItems(items)
      const initialSelections = {}
      items.forEach(i => {
        initialSelections[i.id] = { selected: false, amount: '', dueDate: '' }
      })
      setBatchSelections(initialSelections)
    } catch (err) {
      console.error(err)
    }
  }

  const createInvoice = async () => {
    if (!form.studentUid) { toast.error('Student required'); return }
    
    setSending(true)
    const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    let toCreate = []
    
    if (invoiceTab === 'basic') {
      if (!form.courseName || !form.amount) { toast.error('Course and amount required'); setSending(false); return }
      toCreate.push({
        courseName: form.courseName,
        description: form.description,
        amount: Number(form.amount),
        dueDate: form.dueDate
      })
    } else {
      const selectedKeys = Object.keys(batchSelections).filter(k => batchSelections[k].selected)
      if (selectedKeys.length === 0) { toast.error('Select at least one batch/class'); setSending(false); return }
      
      for (const k of selectedKeys) {
        const itemData = studentEnrolledItems.find(i => i.id === k)
        const sel = batchSelections[k]
        if (!sel.amount) { toast.error(`Amount required for ${itemData.name}`); setSending(false); return }
        toCreate.push({
          courseName: itemData.name,
          description: `Batch/Class Purchase`,
          amount: Number(sel.amount),
          dueDate: sel.dueDate
        })
      }
    }

    let invoiceOk = false
    try {
      for (const item of toCreate) {
        const num = generateInvoiceNumber(invoicesCount + Math.floor(Math.random() * 1000))
        await addDocument('invoices', {
          invoiceNumber: num,
          studentUid: form.studentUid,
          studentName: form.studentName,
          studentEmail: form.studentEmail,
          courseName: item.courseName,
          description: item.description,
          amount: item.amount,
          dueDate: item.dueDate,
          status: 'pending',
          paidAt: '',
          issuedDate: paidAt,
        })
        
        try {
          await addDocument('notifications', {
            studentUid: form.studentUid,
            studentName: form.studentName,
            studentEmail: form.studentEmail,
            subject: `New Invoice ${num}`,
            message: `${item.courseName} — ${formatCurrency(item.amount)}${item.dueDate ? ` · due ${item.dueDate}` : ''}. View in My Invoices.`,
            audience: 'invoice',
            read: false,
          })
        } catch(e) { console.error(e) }
      }
      invoiceOk = true
      toast.success(`${toCreate.length} Invoice(s) created + student notified`)
    } catch (err) {
      console.error('[invoice create]', err)
      toast.error('Invoice failed: ' + (err.message || err.code || 'unknown'))
    }
    
    if (invoiceOk) handleClose()
    setSending(false)
  }

  const handleClose = () => {
    setForm(emptyForm)
    setSearch('')
    setDropdownOpen(false)
    setStudentEnrolledItems([])
    setBatchSelections({})
    setInvoiceTab('basic')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Invoice" size="lg">
      <div className="space-y-4">
        {/* Search + Dropdown */}
        <div className="relative">
          <label className="text-sm font-medium text-slate-300 mb-1 block">Select Student *</label>
          <div className="relative">
            <input
              className="input-field"
              placeholder="Search by name, email, or ID..."
              value={form.studentUid ? `${form.studentName} (${form.studentEmail || form.studentUid})` : search}
              onChange={e => {
                setSearch(e.target.value)
                setDropdownOpen(true)
                if (!e.target.value) setForm({ ...form, studentUid: '', studentName: '', studentEmail: '' })
              }}
              onFocus={() => { if (!form.studentUid) setDropdownOpen(true) }}
            />
            {form.studentUid && (
              <button
                onClick={() => { setForm({ ...form, studentUid: '', studentName: '', studentEmail: '' }); setSearch(''); setDropdownOpen(true) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >✕</button>
            )}
          </div>
          {dropdownOpen && !form.studentUid && filteredStudents.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#111111] border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {filteredStudents.slice(0, 20).map(s => (
                <button
                  key={s.id || s.uid}
                  onClick={() => {
                    setForm({ ...form, studentUid: s.id || s.uid, studentName: s.name, studentEmail: s.email || '' })
                    setSearch('')
                    setDropdownOpen(false)
                    loadStudentItems(s.id || s.uid)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="text-white text-sm">{s.name}</span>
                  <span className="text-slate-500 text-xs">{s.email || s.studentId || s.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs for Basic or Batch Purchases */}
        <div className="flex gap-2 bg-black/30 p-1 rounded-lg w-fit">
          <button onClick={() => setInvoiceTab('basic')} className={`px-4 py-1.5 rounded text-sm font-medium ${invoiceTab === 'basic' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>Basic Purchases</button>
          <button onClick={() => setInvoiceTab('batch')} className={`px-4 py-1.5 rounded text-sm font-medium ${invoiceTab === 'batch' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>Batch/Class Purchases</button>
        </div>

        {invoiceTab === 'basic' ? (
          <>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Course / Service *</label><input className="input-field" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} placeholder="Physics Pro, NEET Batch 2026..." /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Monthly fees, course enrollment..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-300 mb-1 block">Amount (INR) *</label><input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></div>
              <div><label className="text-sm font-medium text-slate-300 mb-1 block">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            {form.studentUid && form.amount && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
                Invoice <b>{formatCurrency(Number(form.amount) || 0)}</b> for <b>{form.studentName}</b>. Student receives notification + sees in My Invoices.
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {studentEnrolledItems.length === 0 ? (
              <p className="text-sm text-slate-400 p-4 border border-slate-800 rounded-lg">No enrolled batches/classes found for this student. Ensure they are assigned a batch in Manage Batch Students.</p>
            ) : (
              studentEnrolledItems.map(item => (
                <div key={item.id} className="p-3 border border-slate-700 rounded-lg bg-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 bg-black/50 text-green-brand focus:ring-green-brand cursor-pointer"
                      checked={batchSelections[item.id]?.selected || false}
                      onChange={(e) => setBatchSelections(prev => ({...prev, [item.id]: {...prev[item.id], selected: e.target.checked}}))}
                    />
                    <span className="text-sm font-bold text-white">{item.name} <span className="text-xs text-slate-400 font-normal ml-1">({item.type})</span></span>
                  </div>
                  {batchSelections[item.id]?.selected && (
                    <div className="grid grid-cols-2 gap-3 pl-7">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Amount *</label>
                        <input type="number" className="input-field text-sm px-3 py-1.5" placeholder="e.g. 500" value={batchSelections[item.id].amount} onChange={(e) => setBatchSelections(prev => ({...prev, [item.id]: {...prev[item.id], amount: e.target.value}}))} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                        <input type="date" className="input-field text-sm px-3 py-1.5" value={batchSelections[item.id].dueDate} onChange={(e) => setBatchSelections(prev => ({...prev, [item.id]: {...prev[item.id], dueDate: e.target.value}}))} />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <button onClick={createInvoice} disabled={sending} className="btn-primary w-full disabled:opacity-50">{sending ? 'Creating...' : 'Create & Send Invoice(s)'}</button>
      </div>
    </Modal>
  )
}
