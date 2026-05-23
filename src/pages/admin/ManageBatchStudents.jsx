import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { updateDocument } from '../../lib/firebaseHelpers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function ManageBatchStudents() {
  const { data: students, loading: loadingStudents } = useRealtimeCollection('students', { orderField: 'createdAt', orderDir: 'desc' });
  const { data: batches, loading: loadingBatches } = useRealtimeCollection('batches');
  
  const [approvalModal, setApprovalModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [enteredBatchCode, setEnteredBatchCode] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'profileForm'));
        if (snap.exists() && snap.data().fields) {
          setFields(snap.data().fields);
        } else {
          setFields([
            { id: 'batchId', label: 'Batch / Class', type: 'batchSelect', required: true },
            { id: 'board', label: 'Board', type: 'boardSelect', required: false },
            { id: 'school', label: 'School / College', type: 'text', required: false },
            { id: 'phone', label: 'Your Phone', type: 'tel', required: true },
            { id: 'parentName', label: 'Parent Name', type: 'text', required: false },
            { id: 'parentPhone', label: 'Parent Phone', type: 'tel', required: false }
          ]);
        }
      } catch (err) {
        console.error("Failed to load fields", err);
      }
    };
    fetchFields();
  }, []);

  const getBatchName = (batchId) => {
    const b = batches.find(x => x.id === batchId);
    return b ? b.name : 'Unknown Batch';
  };

  const openApproveModal = (student) => {
    if (!student.profileCompleted) {
      toast.error('Cannot approve: Student profile is incomplete.');
      return;
    }
    setSelectedStudent(student);
    // Auto-select the requested batch if it exists
    setSelectedBatchId(student.batchId || '');
    setEnteredBatchCode('');
    setApprovalModal(true);
  };

  const openProfileModal = (student) => {
    setSelectedStudent(student);
    setProfileModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedBatchId) return toast.error('Please select a batch to assign');
    
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return toast.error('Selected batch not found');

    if (enteredBatchCode !== batch.batchCode) {
      return toast.error('Incorrect Batch Code! Please enter the exact batch code for this batch.');
    }

    try {
      await updateDocument('students', selectedStudent.id, { 
        batchStatus: 'approved', 
        batch: true,
        assignedBatchId: batch.id,
        assignedBatchName: batch.name,
        assignedBatchCode: batch.batchCode
      });
      toast.success('Student approved and assigned to batch');
      setApprovalModal(false);
    } catch (err) {
      toast.error('Failed to approve student');
    }
  };

  const revokeStudent = async (studentId) => {
    if (!confirm('Reject/Revoke this student access?')) return;
    try {
      await updateDocument('students', studentId, { batchStatus: 'revoked', batch: false });
      toast.success('Student access revoked');
    } catch (err) {
      toast.error('Failed to revoke access');
    }
  };

  const deleteRequest = async (studentId) => {
    if (!confirm('Delete this approval request? The student will need to re-submit their profile.')) return;
    try {
      await updateDocument('students', studentId, { 
        profileCompleted: false, 
        batchStatus: 'pending',
        batchId: null,
        batchName: null 
      });
      toast.success('Request deleted. Student must re-submit profile.');
    } catch (err) {
      toast.error('Failed to delete request');
    }
  };

  if (loadingStudents || loadingBatches) return <div className="p-8"><TableSkeleton /></div>;

  // Filter out students who explicitly chose batch login at signup and have completed their profile (or are already approved/revoked)
  const batchStudents = students.filter(s => 
    (s.batchId || s.batchStatus || s.batch) && 
    (s.profileCompleted || s.batchStatus === 'approved' || s.batchStatus === 'revoked')
  ).filter(s => selectedTab === 'all' || s.batchId === selectedTab || s.assignedBatchId === selectedTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Batch Students</h1>
          <p className="text-sm text-slate-400">Review and approve batch login requests</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedTab('all')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedTab === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          All
        </button>
        {batches.map(b => (
          <button 
            key={b.id}
            onClick={() => setSelectedTab(b.id)} 
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedTab === b.id ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          {batchStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No batch students found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-slate-800">
                <tr>
                  <th className="text-white font-bold">Student Name</th>
                  <th className="text-white font-bold">Email</th>
                  <th className="text-white font-bold">Requested Batch / Class</th>
                  <th className="text-white font-bold">Assigned Batch / Class</th>
                  <th className="text-white font-bold">Profile</th>
                  <th className="text-white font-bold">Status</th>
                  <th className="text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batchStudents.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-semibold text-white">{s.name}</td>
                    <td className="text-slate-400">{s.email}</td>
                    <td className="text-blue-400 font-medium">{getBatchName(s.batchId)}</td>
                    <td className="text-emerald-400 font-medium">{s.assignedBatchName || '-'}</td>
                    <td>
                      {s.profileCompleted ? (
                        <button 
                          onClick={() => openProfileModal(s)}
                          className="badge badge-green cursor-pointer hover:bg-green-500/20 transition-colors"
                          title="View Profile Details"
                        >
                          COMPLETE
                        </button>
                      ) : (
                        <span className="badge badge-red">
                          INCOMPLETE
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.batchStatus === 'approved' ? 'badge-green' : s.batchStatus === 'revoked' ? 'badge-red' : 'badge-amber'}`}>
                        {s.batchStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        {s.batchStatus !== 'approved' && (
                          <button 
                            onClick={() => openApproveModal(s)} 
                            className={`text-sm font-bold cursor-pointer ${s.profileCompleted ? 'text-green-400' : 'text-slate-500 opacity-50 cursor-not-allowed'}`}
                            title={!s.profileCompleted ? "Profile incomplete" : ""}
                          >
                            Approve
                          </button>
                        )}
                        {s.batchStatus !== 'approved' && (
                          <button onClick={() => deleteRequest(s.id)} className="text-sm font-bold text-orange-400 cursor-pointer">Delete Request</button>
                        )}
                        {s.batchStatus !== 'revoked' && (
                          <button onClick={() => revokeStudent(s.id)} className="text-sm font-bold text-red-400 cursor-pointer">Revoke</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={approvalModal} onClose={() => setApprovalModal(false)} title="Approve Student">
        <div className="space-y-4 p-1">
          <p className="text-slate-300 text-sm">Assign <strong className="text-white">{selectedStudent?.name}</strong> to a batch / class.</p>
          
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Assign to Batch / Class</label>
            <select 
              className="input-field w-full"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="">-- Select a Batch --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Confirm Batch / Class Code</label>
            <input 
              type="text"
              placeholder="Enter the code for this batch to confirm"
              className="input-field w-full"
              value={enteredBatchCode}
              onChange={(e) => setEnteredBatchCode(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">You must enter the correct code to approve and send credentials to the student.</p>
          </div>
          
          <div className="pt-2">
            <button onClick={confirmApprove} className="btn-primary w-full bg-green-500 hover:bg-green-600">
              Confirm Approval
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={profileModal} onClose={() => setProfileModal(false)} title="Student Profile Details">
        {selectedStudent && (
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Name</p>
                <p className="text-sm font-semibold text-white">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-white">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              {fields.map(f => (
                <div key={f.id}>
                  <p className="text-xs text-slate-500 mb-1">{f.label}</p>
                  <p className="text-sm font-semibold text-white">
                    {f.type === 'batchSelect' ? (selectedStudent.batchName || '-') : (selectedStudent[f.id] || '-')}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4">
              <button onClick={() => setProfileModal(false)} className="btn-primary w-full bg-slate-700 hover:bg-slate-600 text-white">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
