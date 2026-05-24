import { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { sendTeacherStatusEmail } from '../../lib/emailUtils';

export default function ManageTeachers() {
  const { data: applications, loading } = useRealtimeCollection('teacherApplications');
  const [activeTab, setActiveTab] = useState('application'); // 'application' (all), 'pending', 'approved', 'rejected'
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredApps = applications.filter((app) => {
    if (activeTab === 'application') return true;
    return app.status === activeTab;
  });

  const handleStatusChange = async (appId, newStatus, email, name) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'teacherApplications', appId), {
        status: newStatus,
      });

      // Send Email Notification
      await sendTeacherStatusEmail(name, email, newStatus);
      
      toast.success(`Application marked as ${newStatus}`);
      setViewModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (appId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteDoc(doc(db, 'teacherApplications', appId));
        toast.success('Application deleted');
      } catch (error) {
        toast.error('Failed to delete application');
      }
    }
  };

  if (loading) {
    return <div className="text-white p-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Teacher Applications</h1>
          <p className="text-sm text-slate-400">Review and manage aspiring teachers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {['application', 'pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-green-brand text-white'
                : 'bg-[#111111] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {tab === 'application' ? 'All Applications' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.length > 0 ? (
          filteredApps.map((app, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={app.id}
              className="bg-[#111111] border border-slate-800 rounded-2xl p-5 hover:border-green-brand/30 transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{app.name}</h3>
                  <p className="text-sm text-green-brand">{app.subject}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                    app.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : app.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {app.status || 'pending'}
                </span>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {app.email}
                </p>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {app.phone}
                </p>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  {app.experience} Years Exp.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setViewModal(true);
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                  title="Delete Application"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 bg-[#111111] rounded-2xl border border-slate-800 border-dashed">
            No applications found in this category.
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Application Details">
        {selectedApp && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Full Name</p>
                <p className="text-white font-medium">{selectedApp.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-white font-medium">{selectedApp.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <p className="text-white font-medium">{selectedApp.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <p className="text-white font-medium">{selectedApp.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Experience</p>
                <p className="text-white font-medium">{selectedApp.experience} Years</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="text-white font-medium uppercase tracking-wider">{selectedApp.status || 'pending'}</p>
              </div>
            </div>

            {selectedApp.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <div className="p-3 bg-[#1a1a1a] rounded-xl border border-slate-800 text-sm text-slate-300">
                  {selectedApp.notes}
                </div>
              </div>
            )}

            {selectedApp.resumeLink && (
              <div className="pt-2">
                <a
                  href={selectedApp.resumeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  View Resume / CV
                </a>
              </div>
            )}

            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-bold text-white mb-4">Action</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusChange(selectedApp.id, 'approved', selectedApp.email, selectedApp.name)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(selectedApp.id, 'rejected', selectedApp.email, selectedApp.name)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-3">
                Approving or rejecting will send an automated email to the applicant.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
