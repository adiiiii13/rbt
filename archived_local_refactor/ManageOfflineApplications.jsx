import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { db } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

export default function ManageOfflineApplications() {
  const { data: applications, loading } = useRealtimeCollection('offlineApplications', { orderField: 'submittedAt' });
  const { data: courses } = useRealtimeCollection('courses', 'createdAt');
  const { data: batches } = useRealtimeCollection('batches', 'createdAt');
  
  const [processing, setProcessing] = useState(null);
  
  const [approveModal, setApproveModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [assignCourseType, setAssignCourseType] = useState('select');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignCourseCustom, setAssignCourseCustom] = useState('');

  const updateStatus = async (id, newStatus) => {
    // We only use this for 'rejected' now. 'approved' is handled by handleApproveAndEnroll.
    setProcessing(id);
    try {
      await updateDoc(doc(db, 'offlineApplications', id), {
        status: newStatus
      });
      toast.success(`Application marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveAndEnroll = async () => {
    if (!selectedApp) return;
    
    let titleToAssign = '';
    let idToAssign = '';

    if (assignCourseType === 'custom') {
      if (!assignCourseCustom.trim()) return toast.error('Please enter a course name');
      titleToAssign = assignCourseCustom.trim();
      idToAssign = `custom_${Date.now()}`;
    } else {
      if (!assignCourseId) return toast.error('Please select a course or batch');
      if (assignCourseId.startsWith('course_')) {
        const cId = assignCourseId.replace('course_', '');
        const course = courses?.find(c => c.id === cId);
        if (course) {
          titleToAssign = course.title;
          idToAssign = course.id;
        }
      } else if (assignCourseId.startsWith('batch_')) {
        const bId = assignCourseId.replace('batch_', '');
        const batch = batches?.find(b => b.id === bId);
        if (batch) {
          titleToAssign = batch.name;
          idToAssign = `batch_${bId}`;
        }
      }
    }
    
    if (!titleToAssign) return toast.error('Invalid selection');

    setProcessing(selectedApp.id);
    try {
      // Mark app as approved
      await updateDoc(doc(db, 'offlineApplications', selectedApp.id), {
        status: 'approved'
      });
      
      // Enroll student
      if (selectedApp.userId) {
        const enrollmentData = {
          uid: selectedApp.userId,
          courseId: idToAssign,
          courseTitle: titleToAssign,
          enrolledAt: new Date().toISOString(),
          status: 'active',
          progress: 0,
          accessType: 'full',
        };
        await addDoc(collection(db, 'enrollments'), enrollmentData);
      }

      toast.success('Application approved & student enrolled!');
      setApproveModal(false);
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve and enroll');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    setProcessing(id);
    try {
      await deleteDoc(doc(db, 'offlineApplications', id));
      toast.success('Application deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete application');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Offline Applications</h1>
          <p className="text-slate-400 text-sm">Review and manage offline admission requests</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a0a0a] border-b border-slate-800 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Student Info</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Target Batch</th>
                <th className="px-6 py-4 font-medium">Joining Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No offline applications found.
                  </td>
                </tr>
              ) : (
                applications?.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{app.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={app.userEmail}>{app.userEmail}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={app.schoolOrCollege}>{app.schoolOrCollege}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{app.phone}</div>
                      {app.guardianPhone && <div className="text-xs text-slate-500">G: {app.guardianPhone}</div>}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {app.batchName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.expectedJoinDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        app.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {app.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status !== 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setAssignCourseId(app.batchId ? `batch_${app.batchId}` : '');
                              setApproveModal(true);
                            }}
                            disabled={processing === app.id}
                            className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors"
                            title="Approve & Enroll"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            disabled={processing === app.id}
                            className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                            title="Reject"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={processing === app.id}
                          className="p-1.5 bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white rounded transition-colors ml-2"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve & Enroll Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title={`Approve & Enroll ${selectedApp?.name}`}>
        <div className="p-1 space-y-4">
          <p className="text-sm text-slate-400">Select a course/batch to enroll this student in upon approval.</p>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="assignCourseType" value="select" checked={assignCourseType === 'select'} onChange={() => setAssignCourseType('select')} className="text-green-brand bg-white/5 border-slate-700 focus:ring-green-brand" />
              <span className="text-sm font-medium text-white">Select Existing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="assignCourseType" value="custom" checked={assignCourseType === 'custom'} onChange={() => setAssignCourseType('custom')} className="text-green-brand bg-white/5 border-slate-700 focus:ring-green-brand" />
              <span className="text-sm font-medium text-white">Type Custom</span>
            </label>
          </div>

          {assignCourseType === 'select' ? (
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Select Course or Batch</label>
              <select 
                className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand outline-none"
                value={assignCourseId}
                onChange={(e) => setAssignCourseId(e.target.value)}
              >
                <option value="" disabled className="text-slate-800">Choose...</option>
                <optgroup label="Courses" className="text-slate-800 font-bold">
                  {courses?.map(c => (
                    <option key={`course_${c.id}`} value={`course_${c.id}`} className="font-normal">{c.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Batches" className="text-slate-800 font-bold">
                  {batches?.map(b => (
                    <option key={`batch_${b.id}`} value={`batch_${b.id}`} className="font-normal">{b.name || b.className}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-bold text-white mb-1.5 block">Custom Course/Batch Name</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-green-brand outline-none"
                value={assignCourseCustom}
                onChange={(e) => setAssignCourseCustom(e.target.value)}
                placeholder="e.g. Special Foundation Batch"
              />
            </div>
          )}

          <button 
            onClick={handleApproveAndEnroll} 
            disabled={processing === selectedApp?.id || (assignCourseType === 'select' ? !assignCourseId : !assignCourseCustom)} 
            className="btn-primary w-full shadow-lg disabled:opacity-50"
          >
            {processing === selectedApp?.id ? 'Approving...' : 'Approve & Enroll'}
          </button>
        </div>
      </Modal>

    </div>
  );
}
