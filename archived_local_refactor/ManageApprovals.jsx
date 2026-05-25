import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { updateDocument } from '../../lib/firebaseHelpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { sendStudentStatusEmail } from '../../lib/emailUtils';

export default function ManageApprovals() {
  const { data: enrollments, loading } = useRealtimeCollection('enrollments', 'enrolledAt');
  const [busyId, setBusyId] = useState(null);

  const pendingApprovals = enrollments.filter(e => e.status === 'pending_approval');

  const approveEnrollment = async (enrollment) => {
    setBusyId(enrollment.id);
    try {
      // 1. Activate enrollment
      await updateDocument('enrollments', enrollment.id, { status: 'active' });

      // 2. Try to find and mark the corresponding invoice as paid
      if (enrollment.uid && enrollment.courseName) {
        const q = query(
          collection(db, 'invoices'),
          where('studentUid', '==', enrollment.uid),
          where('courseName', '==', enrollment.courseName),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const invoiceId = snap.docs[0].id;
          const paidAt = new Date().toISOString();
          await updateDocument('invoices', invoiceId, { status: 'paid', paidAt });
        }
      }

      // 3. Notify student
      if (enrollment.studentEmail) {
        await sendStudentStatusEmail(enrollment.studentName, enrollment.studentEmail, 'granted', enrollment.courseName);
      }
      
      toast.success('Enrollment approved & activated');
    } catch (err) {
      toast.error('Failed to approve enrollment: ' + err.message);
    }
    setBusyId(null);
  };

  const rejectEnrollment = async (enrollment) => {
    if (!confirm('Reject this enrollment request?')) return;
    setBusyId(enrollment.id);
    try {
      await updateDocument('enrollments', enrollment.id, { status: 'revoked' });
      toast.success('Enrollment rejected');
    } catch (err) {
      toast.error('Failed to reject: ' + err.message);
    }
    setBusyId(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Offline Approvals</h1>
        <p className="text-sm text-slate-400">Manage offline course enrollment requests</p>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="py-8"><TableSkeleton /></div>
          ) : pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No pending approval requests.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-slate-800">
                <tr>
                  <th className="text-white font-bold">Date</th>
                  <th className="text-white font-bold">Student</th>
                  <th className="text-white font-bold">Course</th>
                  <th className="text-white font-bold">Status</th>
                  <th className="text-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingApprovals.map(req => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="text-slate-400 text-sm">
                      {req.enrolledAt?.toDate ? new Date(req.enrolledAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td>
                      <div className="font-semibold text-white">{req.studentName || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{req.studentEmail || 'No email'}</div>
                    </td>
                    <td className="text-slate-300 font-medium">{req.courseName || 'Unknown Course'}</td>
                    <td>
                      <span className="badge badge-gold">Pending Approval</span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => approveEnrollment(req)} 
                          disabled={busyId === req.id}
                          className="text-sm font-bold text-green-brand hover:text-green-400 cursor-pointer disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => rejectEnrollment(req)} 
                          disabled={busyId === req.id}
                          className="text-sm font-bold text-red-500 hover:text-red-400 cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
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
