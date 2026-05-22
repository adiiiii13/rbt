import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo } from 'react'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers'
import { formatCurrency, generateInvoiceNumber } from '../../lib/invoice'
import InvoiceView from '../../components/InvoiceView'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const emptyForm = { studentUid: '', studentName: '', studentEmail: '', courseName: '', description: '', amount: '', dueDate: '' }

export default function ManageInvoices() {
  const { data: invoices, loading } = useRealtimeCollection('invoices', { fallback: [] })
  const { data: students } = useRealtimeCollection('students', { fallback: [] })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState(null)
  const [filterStudent, setFilterStudent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q))
  }, [students, search])

  // Group invoices by student
  const groups = useMemo(() => {
    const map = new Map()
    invoices.forEach(inv => {
      const key = inv.studentUid || inv.studentEmail || 'unknown'
      if (!map.has(key)) map.set(key, { uid: key, name: inv.studentName, email: inv.studentEmail, items: [], total: 0, paid: 0, pending: 0 })
      const g = map.get(key)
      g.items.push(inv)
      g.total += Number(inv.amount) || 0
      if (inv.status === 'paid') g.paid += Number(inv.amount) || 0
      if (inv.status === 'pending') g.pending += Number(inv.amount) || 0
    })
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending)
  }, [invoices])

  const visibleGroups = useMemo(() => {
    let g = groups
    if (filterStudent !== 'all') g = g.filter(x => x.uid === filterStudent)
    if (filterStatus !== 'all') {
      g = g.map(x => ({ ...x, items: x.items.filter(i => i.status === filterStatus) })).filter(x => x.items.length)
    }
    return g
  }, [groups, filterStudent, filterStatus])

  const createInvoice = async () => {
    if (!form.studentUid || !form.courseName || !form.amount) { toast.error('Student, course and amount required'); return }
    setSending(true)
    try {
      const num = generateInvoiceNumber(invoices.length)
      const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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
        createdAt: new Date(),
        issuedDate: paidAt,
      })
      // Notify student
      await addDocument('notifications', {
        studentUid: form.studentUid,
        studentName: form.studentName,
        studentEmail: form.studentEmail,
        subject: `New Invoice ${num}`,
        message: `${form.courseName} — ${formatCurrency(Number(form.amount))}${form.dueDate ? ` · due ${form.dueDate}` : ''}. View in My Invoices.`,
        audience: 'invoice',
        read: false,
        createdAt: new Date(),
      })
      toast.success(`Invoice ${num} created + student notified`)
      closeModal()
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const markPaid = async (inv) => {
    try {
      const paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      await updateDocument('invoices', inv.id, { status: 'paid', paidAt })
      await addDocument('notifications', {
        studentUid: inv.studentUid,
        studentName: inv.studentName,
        studentEmail: inv.studentEmail,
        subject: `Invoice ${inv.invoiceNumber} marked paid`,
        message: `Payment received for ${inv.courseName} — ${formatCurrency(inv.amount)}.`,
        audience: 'invoice',
        read: false,
        createdAt: new Date(),
      })
      toast.success('Marked paid + student notified')
    } catch (err) { toast.error(err.message) }
  }

  const resend = async (inv) => {
    try {
      await addDocument('notifications', {
        studentUid: inv.studentUid,
        studentName: inv.studentName,
        studentEmail: inv.studentEmail,
        subject: `Reminder: Invoice ${inv.invoiceNumber}`,
        message: `${inv.courseName} — ${formatCurrency(inv.amount)}${inv.dueDate ? ` · due ${inv.dueDate}` : ''}. Please complete payment.`,
        audience: 'invoice',
        read: false,
        createdAt: new Date(),
      })
      toast.success('Reminder sent')
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete invoice?')) return
    try { await deleteDocument('invoices', id); toast.success('Deleted') }
    catch (err) { toast.error(err.message) }
  }

  const closeModal = () => { setModal(false); setForm(emptyForm); setSearch(''); setDropdownOpen(false) }

  const openView = (inv) => {
    setViewInvoice({
      invoiceNumber: inv.invoiceNumber,
      date: inv.issuedDate || inv.paidAt || '—',
      studentName: inv.studentName,
      studentEmail: inv.studentEmail,
      courseTitle: inv.courseName,
      description: inv.description,
      amount: inv.amount,
      transactionId: inv.id,
      paymentMethod: 'Invoice (manual)',
      status: inv.status === 'paid' ? 'Paid' : 'Pending',
    })
  }

  const statusColors = { pending: 'badge-gold', paid: 'badge-green', overdue: 'badge-red' }
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Invoices</h1>
          <p className="text-sm text-slate-400">{invoices.length} invoices · {groups.length} student{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Create Invoice</button>
      </div>
      {loading && <TableSkeleton />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-500">{invoices.filter(i => i.status === 'pending').length}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Paid</p>
          <p className="text-xl font-bold text-green-brand">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="input-field w-auto" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="all">All students</option>
          {groups.map(g => <option key={g.uid} value={g.uid}>{g.name}</option>)}
        </select>
        <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {visibleGroups.map(g => (
          <div key={g.uid} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
              <div>
                <div className="font-bold text-white">{g.name || '(no name)'}</div>
                <div className="text-xs text-slate-500">{g.email || g.uid}</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">{g.items.length} invoice{g.items.length !== 1 ? 's' : ''}</span>
                {g.pending > 0 && <span className="badge badge-gold">Due {formatCurrency(g.pending)}</span>}
                {g.paid > 0 && <span className="badge badge-green">Paid {formatCurrency(g.paid)}</span>}
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="text-white">Invoice #</th>
                    <th className="text-white">Course</th>
                    <th className="text-white">Amount</th>
                    <th className="text-white">Due</th>
                    <th className="text-white">Status</th>
                    <th className="text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map(inv => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs text-white">{inv.invoiceNumber}</td>
                      <td className="text-slate-300 text-sm">
                        <div>{inv.courseName}</div>
                        {inv.description && <div className="text-xs text-slate-500">{inv.description}</div>}
                      </td>
                      <td className="text-green-brand font-semibold">{formatCurrency(inv.amount)}</td>
                      <td className="text-slate-400 text-sm">{inv.dueDate || '—'}</td>
                      <td><span className={`badge ${statusColors[inv.status] || 'badge-navy'}`}>{inv.status}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => openView(inv)} className="text-xs text-blue-400 cursor-pointer">View</button>
                          {inv.status === 'pending' && (
                            <>
                              <button onClick={() => markPaid(inv)} className="text-xs text-green-brand font-bold cursor-pointer">Mark Paid</button>
                              <button onClick={() => resend(inv)} className="text-xs text-amber-400 cursor-pointer">Remind</button>
                            </>
                          )}
                          <button onClick={() => remove(inv.id)} className="text-xs text-red-400 cursor-pointer">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!loading && visibleGroups.length === 0 && (
          <div className="bg-[#111111] rounded-2xl p-12 border border-slate-800 text-center">
            <p className="text-slate-400">No invoices yet. Click "Create Invoice" to bill a student.</p>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={modal} onClose={closeModal} title="Create Invoice" size="lg">
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

          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Course / Service *</label><input className="input-field" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} placeholder="Physics Pro, NEET Batch 2026..." /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Monthly fees, course enrollment..." /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Amount (INR) *</label><input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Due Date</label><input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>

          {/* Preview */}
          {form.studentUid && form.amount && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
              Invoice <b>{formatCurrency(Number(form.amount) || 0)}</b> for <b>{form.studentName}</b>. Student receives notification + sees in My Invoices.
            </div>
          )}

          <button onClick={createInvoice} disabled={sending} className="btn-primary w-full disabled:opacity-50">{sending ? 'Creating...' : 'Create & Send Invoice'}</button>
        </div>
      </Modal>

      {/* View Invoice Modal (Payment-style) */}
      <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Preview" size="lg">
        {viewInvoice && <InvoiceView invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
      </Modal>
    </div>
  )
}
