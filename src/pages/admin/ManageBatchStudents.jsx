import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { updateDocument } from '../../lib/firebaseHelpers';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function ManageBatchStudents() {
  const { data: students, loading: loadingStudents } = useRealtimeCollection('students', { orderField: 'createdAt', orderDir: 'desc' });
  const { data: batches, loading: loadingBatches } = useRealtimeCollection('batches');

  const getBatchName = (batchId) => {
    const b = batches.find(x => x.id === batchId);
    return b ? b.name : 'Unknown Batch';
  };

  const approveStudent = async (studentId) => {
    try {
      await updateDocument('students', studentId, { batchStatus: 'approved', batch: true });
      toast.success('Student approved and added to batch');
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

  const batchStudents = students.filter(s => s.batchId);

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
                    <td>
                      <span className={`badge ${s.batchStatus === 'approved' ? 'badge-green' : s.batchStatus === 'revoked' ? 'badge-red' : 'badge-amber'}`}>
                        {s.batchStatus?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        {s.batchStatus === 'pending' && (
                          <button onClick={() => approveStudent(s.id)} className="text-sm font-bold text-green-400 cursor-pointer">Approve</button>
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
    </div>
  );
}
