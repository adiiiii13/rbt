import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument } from '../../lib/firebaseHelpers';
import { defaultAchievements } from '../../data/achievements';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExportButton from '../../components/ExportButton';

const emptyForm = { studentName: '', course: '', result: '', year: '2025', description: '', marks: '' };

export default function ManageAchievements() {
  const { data: items, loading } = useRealtimeCollection('achievements', { fallback: [] });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    try {
      if (editing) {
        await updateDocument('achievements', editing.id, form);
        toast.success('Updated');
      } else {
        await addDocument('achievements', form);
        toast.success('Added');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await deleteItemSmart('achievements', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const openEdit = (a) => { setEditing(a); setForm({ studentName: a.studentName, course: a.course, result: a.result, year: a.year, description: a.description, marks: a.marks }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Achievements</h1><p className="text-sm text-slate-400">{items.length} achievements</p></div>
        <div className="flex gap-2">
          <ExportButton data={items} filename="achievements" columns={[
            { key: 'studentName', label: 'Student' },
            { key: 'course', label: 'Course' },
            { key: 'result', label: 'Result' },
            { key: 'marks', label: 'Marks' },
            { key: 'year', label: 'Year' },
            { key: 'description', label: 'Description' },
          ]} />
          <button onClick={() => setModal(true)} className="btn-primary">+ Add</button>
        </div>
      </div>
      {loading && <TableSkeleton />}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th>Student</th><th>Course</th><th>Result</th><th>Marks</th><th>Year</th><th>Actions</th></tr></thead>
            <tbody>{items.map(a => (
              <tr key={a.id}>
                <td className="font-medium text-white">{a.studentName}</td>
                <td>{a.course}</td>
                <td className="font-semibold text-green-brand">{a.result}</td>
                <td>{a.marks}</td>
                <td><span className="badge badge-gold">{a.year}</span></td>
                <td><div className="flex gap-2"><button onClick={() => openEdit(a)} className="text-sm text-blue-600 cursor-pointer">Edit</button><button onClick={() => remove(a.id)} className="text-sm text-red-600 cursor-pointer">Delete</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Achievement' : 'Add Achievement'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Student Name</label><input className="input-field" value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Course</label><input className="input-field" value={form.course} onChange={e => setForm({...form, course: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Result</label><input className="input-field" value={form.result} onChange={e => setForm({...form, result: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Marks</label><input className="input-field" value={form.marks} onChange={e => setForm({...form, marks: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Year</label><input className="input-field" value={form.year} onChange={e => setForm({...form, year: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Achievement</button>
        </div>
      </Modal>
    </div>
  );
}
