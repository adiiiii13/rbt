import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import ExportButton from '../../components/ExportButton';

export default function ManageBatches() {
  const { data: batches, loading } = useRealtimeCollection('batches', { orderField: 'createdAt', orderDir: 'desc' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ batchCode: '', board: '', className: '', timings: [] });
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

  const toggleTiming = (timing) => {
    setForm(prev => {
      const current = prev.timings || [];
      if (current.includes(timing)) {
        return { ...prev, timings: current.filter(t => t !== timing) };
      } else {
        return { ...prev, timings: [...current, timing] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.className || !form.batchCode) return toast.error('Class and Batch Code are required');

    const saveData = {
      name: form.className,
      batchCode: form.batchCode,
      board: form.board || '',
      className: form.className || '',
      timings: form.timings || []
    };

    try {
      if (form.id) {
        await updateDocument('batches', form.id, saveData);
        toast.success('Batch / Class updated');
      } else {
        await addDocument('batches', saveData);
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

  const openEdit = (b) => {
    setForm({
      ...b,
      timings: b.timings || (b.timing ? [b.timing] : [])
    });
    setModal(true);
  };

  if (loading) return <div className="p-8"><TableSkeleton /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Batches / Classes</h1>
          <p className="text-sm text-slate-400">{batches.length} batches / classes active</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={batches} filename="batches" columns={[
            { key: 'batchCode', label: 'Batch Code' },
            { key: 'board', label: 'Board' },
            { key: 'className', label: 'Class' },
            { key: 'timings', label: 'Timings' },
            { key: 'createdAt', label: 'Created' },
          ]} />
          <button onClick={() => { setForm({ batchCode: '', board: '', className: '', timings: [] }); setModal(true); }} className="btn-primary shadow-lg">+ Create Batch / Class</button>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-slate-800">
              <tr>
                <th className="text-white font-bold">Batch / Class</th>
                <th className="text-white font-bold">Code</th>
                <th className="text-white font-bold">Board</th>
                <th className="text-white font-bold">Timings</th>
                <th className="text-white font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="font-semibold text-white">{b.className || b.name}</td>
                  <td className="font-mono text-emerald-400 font-bold">{b.batchCode}</td>
                  <td className="text-slate-300">{b.board || '-'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {(b.timings || (b.timing ? [b.timing] : [])).length > 0
                        ? (b.timings || [b.timing]).map(t => (
                          <span key={t} className="text-[11px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-medium">{t}</span>
                        ))
                        : <span className="text-slate-500">-</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(b)} className="text-sm font-bold text-blue-400 cursor-pointer">Edit</button>
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
            <label className="text-sm font-bold text-white mb-1.5 block">Batch / Class *</label>
            <select className="input-field w-full" value={form.className} onChange={e => setForm({ ...form, className: e.target.value })}>
              <option value="">Select Batch/Class...</option>
              {options.classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">This will be the name shown to students.</p>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch / Class Code *</label>
            <input className="input-field w-full" value={form.batchCode} onChange={e => setForm({ ...form, batchCode: e.target.value })} placeholder="e.g. C10" />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Board</label>
            <select className="input-field w-full" value={form.board} onChange={e => setForm({ ...form, board: e.target.value })}>
              <option value="">Select Board...</option>
              {options.boards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-2 block">Timings</label>
            {options.timings.length > 0 ? (
              <div className="space-y-2 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                {options.timings.map(t => (
                  <label key={t} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(form.timings || []).includes(t)}
                      onChange={() => toggleTiming(t)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-brand focus:ring-green-brand/30 focus:ring-offset-0"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{t}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No timings configured. Add timings in Profile Form Settings.</p>
            )}
            <p className="text-[10px] text-slate-500 mt-1.5">Selected timings will be visible to students next to this batch/class.</p>
          </div>
          <div className="pt-2"><button type="submit" className="btn-primary w-full">Save Batch / Class</button></div>
        </form>
      </Modal>
    </div>
  );
}
