import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRealtimeCollection } from '../../lib/useRealtimeCollection'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'

const TrashIcon = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
const SearchIcon = ({ size = 18, className = '' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
const AlertTriangleIcon = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>

export default function ManageEnrollments() {
  const { data: enrollments, loading } = useRealtimeCollection('enrollments', 'enrolledAt', 'desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmModal, setConfirmModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Get unique courses for filter dropdown
  const uniqueCourses = [...new Set(enrollments?.map(e => e.courseName || e.courseTitle))].filter(Boolean)

  const filtered = enrollments?.filter(e => {
    const matchesSearch = (e.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCourse = courseFilter ? (e.courseName || e.courseTitle) === courseFilter : true
    return matchesSearch && matchesCourse
  }) || []

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filtered.map(enrol => enrol.id))
    else setSelectedIds([])
  }

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    setDeleting(true)
    try {
      const promises = selectedIds.map(id => deleteDoc(doc(db, 'enrollments', id)))
      await Promise.all(promises)
      toast.success(`Successfully cleared ${selectedIds.length} enrollment(s)`)
      setSelectedIds([])
      setConfirmModal(false)
    } catch (err) {
      toast.error('Failed to clear enrollments: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-white p-8 animate-pulse">Loading enrollments...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Clear Enrollments</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and remove student enrollments. Use caution.</p>
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={() => setConfirmModal(true)} 
            className="btn-danger flex items-center gap-2 px-4 py-2"
          >
            <TrashIcon size={18} />
            Clear Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-green-brand outline-none"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand outline-none min-w-[200px]"
        >
          <option value="">All Courses & Batches</option>
          {uniqueCourses.map(courseName => (
            <option key={courseName} value={courseName}>{courseName}</option>
          ))}
        </select>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-slate-300 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-brand focus:ring-green-brand focus:ring-offset-slate-800"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4">Student</th>
                <th className="p-4">Course / Batch</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No enrollments found.</td></tr>
              ) : (
                filtered.map(enrol => (
                  <tr key={enrol.id} className={`hover:bg-slate-700/20 transition-colors ${selectedIds.includes(enrol.id) ? 'bg-red-500/10' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-brand focus:ring-green-brand focus:ring-offset-slate-800"
                        checked={selectedIds.includes(enrol.id)}
                        onChange={() => handleSelect(enrol.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{enrol.studentName || 'Unknown Student'}</div>
                      <div className="text-xs text-slate-400">{enrol.studentEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{enrol.courseName || enrol.courseTitle}</div>
                      <div className="text-xs text-slate-400">ID: {enrol.courseId}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${enrol.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {enrol.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {enrol.enrolledAt?.toDate().toLocaleDateString() || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
              <AlertTriangleIcon size={18} />
              Warning: Destructive Action
            </h3>
            <p className="text-slate-300 text-sm">
              You are about to permanently clear <strong>{selectedIds.length}</strong> enrollment(s). 
              The selected students will immediately lose access to these courses/batches. This action cannot be undone.
            </p>
          </div>
          <p className="text-white text-sm">Are you absolutely sure you want to proceed?</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setConfirmModal(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleDeleteSelected} disabled={deleting} className="btn-danger shadow-lg">
              {deleting ? 'Clearing...' : `Yes, Clear ${selectedIds.length} Enrollments`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
