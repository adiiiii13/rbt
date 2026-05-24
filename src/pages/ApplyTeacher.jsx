import { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ApplyTeacher() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    experience: '',
    resumeLink: '',
    notes: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalResumeUrl = form.resumeLink;

      if (resumeFile) {
        const fileRef = ref(storage, `resumes/${Date.now()}_${resumeFile.name}`);
        const snapshot = await uploadBytes(fileRef, resumeFile);
        finalResumeUrl = await getDownloadURL(snapshot.ref);
      }

      if (!finalResumeUrl && !form.resumeLink) {
        toast.error('Please provide a resume link or upload a file.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'teacherApplications'), {
        ...form,
        resumeLink: finalResumeUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Application submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] border border-slate-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Apply as Teacher</h1>
            <p className="text-slate-400">Join our mission to provide quality education.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject Expertise *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Physics, Mathematics"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience *</label>
              <input
                type="number"
                min="0"
                required
                className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 5"
              />
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-xl border border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">Resume / CV *</label>
              <p className="text-xs text-slate-500 mb-4">Upload your resume (PDF/Doc) or provide a Google Drive link.</p>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-brand/10 file:text-green-brand hover:file:bg-green-brand/20 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-slate-800"></div>
                  <span className="text-xs text-slate-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-slate-800"></div>
                </div>
                <div>
                  <input
                    type="url"
                    className="w-full bg-[#111111] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-brand transition-colors text-sm"
                    value={form.resumeLink}
                    onChange={(e) => setForm({ ...form, resumeLink: e.target.value })}
                    placeholder="Paste Google Drive link here"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes (Optional)</label>
              <textarea
                className="w-full bg-[#1a1a1a] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-brand transition-colors h-24 resize-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Tell us a little bit about your teaching methodology..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-brand hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
