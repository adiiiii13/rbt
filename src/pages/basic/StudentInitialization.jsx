import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import toast from 'react-hot-toast'

export default function StudentInitialization() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Polling to check for approval status changes
  useEffect(() => {
    if (!user || user.batchStatus !== 'pending') return;
    
    const interval = setInterval(async () => {
      try {
        const snap = await getDoc(doc(db, 'students', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.batchStatus === 'approved' || data.batchStatus === 'revoked') {
            toast.success('Your batch status has been updated!');
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Profile not completed => force completion
  if (!user?.profileCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Complete Your Profile</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">You must complete your profile to proceed with the batch enrollment process.</p>
        <button 
          onClick={() => window.dispatchEvent(new Event('openProfilePopup'))} 
          className="btn-primary bg-amber-500 hover:bg-amber-600 text-white text-lg px-8 py-3"
        >
          Complete Profile Now
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}</h1>
        <p className="text-slate-400">Your profile is complete. Review your enrollment status below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Card */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h2 className="text-xl font-bold text-white">Your Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">FULL NAME</p>
              <p className="text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">EMAIL</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">PHONE NUMBER</p>
              <p className="text-white">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">STUDENT ID</p>
              <p className="text-white font-mono text-sm">{user.studentId}</p>
            </div>
          </div>
        </div>

        {/* Batch Credentials Card */}
        <div className="bg-[#111111] rounded-2xl border border-slate-800 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <h2 className="text-xl font-bold text-white">Batch Credentials</h2>
          </div>

          {user.batchStatus === 'pending' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4 animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pending Admin Approval</h3>
              <p className="text-sm text-slate-400">
                Your profile has been submitted successfully. An administrator will review your details and assign your batch access shortly.
              </p>
            </div>
          )}

          {user.batchStatus === 'approved' && (
            <div className="flex-1 flex flex-col">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <p className="text-green-400 text-sm font-bold flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Access Approved
                </p>
                <p className="text-slate-300 text-sm">You have been successfully assigned to a batch.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">ASSIGNED BATCH</p>
                  <p className="text-white font-bold text-lg">{user.assignedBatchName || 'Standard Batch'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">BATCH CODE</p>
                  <p className="text-emerald-400 font-mono font-bold text-xl">{user.assignedBatchCode || 'N/A'}</p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/student')}
                className="btn-primary w-full mt-auto py-3 text-lg flex items-center justify-center gap-2"
              >
                Go to Batch Dashboard
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}

          {user.batchStatus === 'revoked' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Access Revoked</h3>
              <p className="text-sm text-slate-400">
                Your batch access has been revoked. Please contact administration for assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
