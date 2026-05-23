import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function ManageBatches() {
  const { data: batches, loading } = useRealtimeCollection('batches', { orderField: 'createdAt', orderDir: 'desc' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', batchCode: '', board: '', className: '', timing: '' });
  const [options, setOptions] = useState({ boards: [], classes: [], timings: [] });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'profileForm'));
        if (snap.exists()) {
          const data = snap.data();
          setOptions({
            boards: data.boards || [],
            classes: data.classes || [],
            timings: data.timings || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch options", err);
      }
    };
    fetchOptions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.batchCode) return toast.error('All fields are required');

    try {
      if (form.id) {
        await updateDocument('batches', form.id, { 
          name: form.name, 
          batchCode: form.batchCode,
          board: form.board || '',
          className: form.className || '',
          timing: form.timing || ''
        });
        toast.success('Batch / Class updated');
      } else {
        await addDocument('batches', { 
          name: form.name, 
          batchCode: form.batchCode,
          board: form.board || '',
          className: form.className || '',
          timing: form.timing || ''
        });
        toast.success('Batch / Class created');
      }
      setModal(false);
    } catch (err) {
      toast.error('Failed to save batch / class');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this batch / class?')) return;
    try {
      await deleteDocument('batches', id);
      toast.success('Batch / Class deleted');
    } catch (err) {
      toast.error('Failed to delete batch / class');
    }
  };

  if (loading) return <div className="p-8"><TableSkeleton /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Batches / Classes</h1>
          <p className="text-sm text-slate-400">{batches.length} batches / classes active</p>
        </div>
        <button onClick={() => { setForm({ name: '', batchCode: '', board: '', className: '', timing: '' }); setModal(true); }} className="btn-primary shadow-lg">+ Create Batch / Class</button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-slate-800">
              <tr>
                <th className="text-white font-bold">Batch / Class Name</th>
                <th className="text-white font-bold">Batch / Class Code</th>
                <th className="text-white font-bold">Board</th>
                <th className="text-white font-bold">Class</th>
                <th className="text-white font-bold">Timing</th>
                <th className="text-white font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="font-semibold text-white">{b.name}</td>
                  <td className="font-mono text-emerald-400 font-bold">{b.batchCode}</td>
                  <td className="text-slate-300">{b.board || '-'}</td>
                  <td className="text-slate-300">{b.className || '-'}</td>
                  <td className="text-slate-300">{b.timing || '-'}</td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => { setForm(b); setModal(true); }} className="text-sm font-bold text-blue-400 cursor-pointer">Edit</button>
                      <button onClick={() => remove(b.id)} className="text-sm font-bold text-red-400 cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Batch / Class' : 'Create Batch / Class'}>
        <form onSubmit={handleSave} className="space-y-4 p-1">
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch / Class Name</label>
            <input className="input-field w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Foundation 2026 or Class 10" />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch / Class Code</label>
            <input className="input-field w-full" value={form.batchCode} onChange={e => setForm({ ...form, batchCode: e.target.value })} placeholder="e.g. F2026 or C10" />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Board</label>
            <select className="input-field w-full" value={form.board} onChange={e => setForm({ ...form, board: e.target.value })}>
              <option value="">Select Board...</option>
              {options.boards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Class</label>
            <select className="input-field w-full" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })}>
              <option value="">Select Class...</option>
              {options.classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Timing</label>
            <select className="input-field w-full" value={form.timing} onChange={e => setForm({ ...form, timing: e.target.value })}>
              <option value="">Select Timing...</option>
              {options.timings.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="pt-2"><button type="submit" className="btn-primary w-full">Save Batch / Class</button></div>
        </form>
      </Modal>
    </div>
  );
}
