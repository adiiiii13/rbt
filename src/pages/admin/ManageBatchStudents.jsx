import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { updateDocument } from '../../lib/firebaseHelpers';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function ManageBatchStudents() {
  const { data: students, loading: loadingStudents } = useRealtimeCollection('students', { orderField: 'createdAt', orderDir: 'desc' });
  const { data: batches, loading: loadingBatches } = useRealtimeCollection('batches');
  
  const [approvalModal, setApprovalModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');

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
    setApprovalModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedBatchId) return toast.error('Please select a batch to assign');
    
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return toast.error('Selected batch not found');

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

  if (loadingStudents || loadingBatches) return <div className="p-8"><TableSkeleton /></div>;

  // Filter out students who explicitly chose batch login at signup
  const batchStudents = students.filter(s => s.batchId || s.batchStatus || s.batch);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Batch Students</h1>
          <p className="text-sm text-slate-400">Review and approve batch login requests</p>
        </div>
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
                  <th className="text-white font-bold">Requested Batch</th>
                  <th className="text-white font-bold">Assigned Batch</th>
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
                      <span className={`badge ${s.profileCompleted ? 'badge-green' : 'badge-red'}`}>
                        {s.profileCompleted ? 'COMPLETE' : 'INCOMPLETE'}
                      </span>
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
          <p className="text-slate-300 text-sm">Assign <strong className="text-white">{selectedStudent?.name}</strong> to a batch.</p>
          
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Assign to Batch</label>
            <select 
              className="input-field w-full"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="">-- Select a Batch --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} (Code: {b.batchCode})</option>
              ))}
            </select>
          </div>
          
          <div className="pt-2">
            <button onClick={confirmApprove} className="btn-primary w-full bg-green-500 hover:bg-green-600">
              Confirm Approval
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
