import { useState, useMemo } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, deleteDocument } from '../../lib/firebaseHelpers'
import { formatCurrency, generateInvoiceNumber } from '../../lib/invoice'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

export default function ManageInvoices() {
  const { data: invoices, loading } = useRealtimeCollection('invoices', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ studentUid: '', studentName: '', studentEmail: '', courseName: '', description: '', amount: '', dueDate: '' })
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q))
  }, [students, search])

  const createInvoice = async () => {
    if (!form.studentUid || !form.courseName || !form.amount) { toast.error('Student, course and amount required'); return }
    setSending(true)
    try {
      const num = generateInvoiceNumber(invoices.length)
      await addDocument('invoices', {
        invoiceNumber: num,
        studentUid: form.studentUid,
        studentName: form.studentName,
        studentEmail: form.studentEmail,
        courseName: form.courseName,
        description: form.description,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        status: 'pending',
        paidAt: '',
      })
      toast.success(`Invoice ${num} created`)
      setModal(false)
      setForm({ studentUid: '', studentName: '', studentEmail: '', courseName: '', description: '', amount: '', dueDate: '' })
      setSearch('')
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete invoice?')) return
    try { await deleteDocument('invoices', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const statusColors = { pending: 'badge-gold', paid: 'badge-green', overdue: 'badge-red' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Invoices</h1><p className="text-sm text-slate-400">{invoices.length} invoices</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Create Invoice</button>
      </div>
      {loading && <p className="text-slate-400 text-sm mb-4">Loading...</p>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-500">{invoices.filter(i => i.status === 'pending').length}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Paid</p>
          <p className="text-xl font-bold text-green-brand">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-white">{formatCurrency(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0))}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th className="text-white">Invoice #</th><th className="text-white">Student</th><th className="text-white">Course</th><th className="text-white">Amount</th><th className="text-white">Due Date</th><th className="text-white">Status</th><th className="text-white">Actions</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs text-white">{inv.invoiceNumber}</td>
                  <td className="text-slate-300 text-sm">{inv.studentName}</td>
                  <td className="text-slate-300 text-sm">{inv.courseName}</td>
                  <td className="text-green-brand font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="text-slate-400 text-sm">{inv.dueDate || '—'}</td>
                  <td><span className={`badge ${statusColors[inv.status] || 'badge-navy'}`}>{inv.status}</span></td>
                  <td>
                    <button onClick={() => remove(inv.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={modal} onClose={() => { setModal(false); setForm({ studentUid: '', studentName: '', studentEmail: '', courseName: '', description: '', amount: '', dueDate: '' }); setSearch('') }} title="Create Invoice">
        <div className="space-y-4">
          {/* Search + Dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-slate-300 mb-1 block">Select Student</label>
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

          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Course / Service</label><input className="input-field" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} placeholder="Physics Pro, NEET Batch 2026..." /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Monthly fees, course enrollment..." /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Amount (INR)</label><input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <button onClick={createInvoice} disabled={sending} className="btn-primary w-full disabled:opacity-50">{sending ? 'Creating...' : 'Create & Send Invoice'}</button>
        </div>
      </Modal>
    </div>
  )
}
