import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE Dropper', 'NEET Dropper']
const BATCHES = ['Morning Batch', 'Evening Batch', 'Weekend Batch', 'Online Batch', 'Crash Course', 'Dropper Batch']
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB', 'Other']

export default function StudentProfile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    className: user?.className || user?.class || '',
    batch: user?.batch === true ? 'Batch Student' : (user?.batch || ''),
    board: user?.board || 'CBSE',
    phone: user?.phone || '',
    school: user?.school || '',
    parentName: user?.parentName || '',
    parentPhone: user?.parentPhone || '',
  })

  const save = async () => {
    if (!form.className || !form.phone) { toast.error('Class and phone required'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        className: form.className,
        batch: form.batch,
        board: form.board,
        phone: form.phone,
        school: form.school,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString(),
      })
      toast.success('Profile updated')
      setEditing(false)
      window.location.reload()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-400 text-sm">View and update your details</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-[#111111] rounded-2xl p-6 border border-slate-800">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-green-brand/20 flex items-center justify-center text-green-brand text-2xl font-bold">
            {(user?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name || 'Student'}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: {user?.studentId || user?.id?.substring(0, 8).toUpperCase()}</p>
            <div className="flex gap-2 mt-1">
              <span className={`badge text-xs ${user?.batch ? 'badge-green' : 'badge-navy'}`}>{user?.batch ? 'Batch' : 'Basic'}</span>
              {form.className && <span className="badge badge-navy text-xs">{form.className}</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Class *</label>
                <select className="input-field" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })}>
                  <option value="">Select class</option>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-1 block">Board</label>
                <select className="input-field" value={form.board} onChange={e => setForm({ ...form, board: e.target.value })}>
                  {BOARDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Batch</label>
              <select className="input-field" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>
                <option value="">Select batch</option>
                {BATCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">School / College</label>
              <input className="input-field" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Your Phone *</label>
              <input className="input-field" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 uppercase font-bold mb-3">Parent Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 font-medium mb-1 block">Parent Name</label>
                  <input className="input-field" value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-300 font-medium mb-1 block">Parent Phone</label>
                  <input className="input-field" type="tel" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white cursor-pointer">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Email" value={user?.email} />
              <InfoRow label="Phone" value={form.phone || 'Not set'} />
              <InfoRow label="Class" value={form.className || 'Not set'} />
              <InfoRow label="Board" value={form.board} />
              <InfoRow label="Batch" value={form.batch || 'Not set'} />
              <InfoRow label="School" value={form.school || 'Not set'} />
              <InfoRow label="Parent Name" value={form.parentName || 'Not set'} />
              <InfoRow label="Parent Phone" value={form.parentPhone || 'Not set'} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase font-bold mb-1">{label}</p>
      <p className="text-white text-sm">{value || '—'}</p>
    </div>
  )
}
