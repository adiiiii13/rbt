import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import toast from 'react-hot-toast';

export default function OfflineApplication() {
  const { user } = useAuth();
  const { data: batches } = useRealtimeCollection('batches');
  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    guardianPhone: user?.guardianPhone || '',
    batchId: '',
    address: '',
    schoolOrCollege: user?.schoolOrCollege || '',
    expectedJoinDate: '',
  });

  // Check if user already submitted an application
  useEffect(() => {
    async function checkExisting() {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'offlineApplications'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setExistingApp(snap.docs[0].data());
        }
      } catch (err) {
        console.error("Error checking existing applications", err);
      }
    }
    checkExisting();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batchId || !formData.phone || !formData.address || !formData.expectedJoinDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const selectedBatch = batches.find(b => b.id === formData.batchId);
      
      const payload = {
        userId: user.uid,
        userEmail: user.email,
        ...formData,
        batchName: selectedBatch?.name || '',
        status: 'pending', // pending, approved, rejected
        submittedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'offlineApplications'), payload);
      toast.success('Offline Application Submitted Successfully!');
      setExistingApp(payload);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (existingApp) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-[#111111] rounded-3xl border border-slate-800 text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-slate-400 mb-6">
          We have received your application for offline admission. Our team will review it and contact you shortly.
        </p>
        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-slate-800 text-left space-y-3">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-500 text-sm">Status</span>
            <span className={`text-sm font-bold capitalize ${
              existingApp.status === 'approved' ? 'text-green-500' :
              existingApp.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
            }`}>{existingApp.status || 'Pending'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-500 text-sm">Batch</span>
            <span className="text-white text-sm font-medium">{existingApp.batchName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Expected Join Date</span>
            <span className="text-white text-sm font-medium">{existingApp.expectedJoinDate}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Offline Admission Application</h1>
        <p className="text-slate-400">Fill out this form to apply for offline classes at RBT Mission Learning.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111111] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Full Name *</label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Your Phone Number *</label>
            <input 
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Guardian Phone</label>
            <input 
              type="tel"
              value={formData.guardianPhone}
              onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all"
              placeholder="Guardian's contact"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Current School/College</label>
            <input 
              type="text"
              value={formData.schoolOrCollege}
              onChange={(e) => setFormData({...formData, schoolOrCollege: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all"
              placeholder="Where do you study?"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Select Target Batch *</label>
            <select
              required
              value={formData.batchId}
              onChange={(e) => setFormData({...formData, batchId: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all appearance-none"
            >
              <option value="">-- Choose a Batch --</option>
              {batches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Expected Joining Date *</label>
            <input 
              type="date"
              required
              value={formData.expectedJoinDate}
              onChange={(e) => setFormData({...formData, expectedJoinDate: e.target.value})}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-300">Full Address *</label>
          <textarea 
            required
            rows="3"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-green-brand focus:ring-1 focus:ring-green-brand outline-none transition-all resize-none"
            placeholder="Enter your complete residential address"
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-green-brand hover:bg-green-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
