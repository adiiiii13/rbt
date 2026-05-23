import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function ManageBatches() {
  const { data: batches, loading } = useRealtimeCollection('batches', { orderField: 'createdAt', orderDir: 'desc' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', batchCode: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.batchCode) return toast.error('All fields are required');

    try {
      if (form.id) {
        await updateDocument('batches', form.id, { name: form.name, batchCode: form.batchCode });
        toast.success('Batch updated');
      } else {
        await addDocument('batches', { name: form.name, batchCode: form.batchCode });
        toast.success('Batch created');
      }
      setModal(false);
    } catch (err) {
      toast.error('Failed to save batch');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await deleteDocument('batches', id);
      toast.success('Batch deleted');
    } catch (err) {
      toast.error('Failed to delete batch');
    }
  };

  if (loading) return <div className="p-8"><TableSkeleton /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Batches</h1>
          <p className="text-sm text-slate-400">{batches.length} batches active</p>
        </div>
        <button onClick={() => { setForm({ name: '', batchCode: '' }); setModal(true); }} className="btn-primary shadow-lg">+ Create Batch</button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-slate-800">
              <tr>
                <th className="text-white font-bold">Batch Name</th>
                <th className="text-white font-bold">Batch Code</th>
                <th className="text-white font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="font-semibold text-white">{b.name}</td>
                  <td className="font-mono text-emerald-400 font-bold">{b.batchCode}</td>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Batch' : 'Create Batch'}>
        <form onSubmit={handleSave} className="space-y-4 p-1">
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Foundation 2026" />
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-1.5 block">Batch Code</label>
            <input className="input-field" value={form.batchCode} onChange={e => setForm({ ...form, batchCode: e.target.value })} placeholder="e.g. F2026" />
          </div>
          <div className="pt-2"><button type="submit" className="btn-primary w-full">Save Batch</button></div>
        </form>
      </Modal>
    </div>
  );
}
