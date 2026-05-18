import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/contentApi';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import { defaultPdfs } from '../../data/pdfs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { FileTextIcon } from '../../components/Icons';

const emptyForm = { title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', url: '', fileName: '' };

export default function ManagePdfs() {
  const { data: pdfs, loading } = useRealtimeCollection('pdfs', 'createdAt', defaultPdfs);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    if (!form.url) { toast.error('Paste a PDF URL'); return; }
    const payload = { ...form, downloads: form.downloads || 0 };
    try {
      if (editing) {
        await updateDocument('pdfs', editing.id, payload);
        toast.success('Updated');
      } else {
        await addDocument('pdfs', payload);
        toast.success('Added');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await deleteDocument('pdfs', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, class: p.class, subject: p.subject, examType: p.examType, date: p.date || '', url: p.url || '', fileName: p.fileName || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage PDFs</h1><p className="text-sm text-slate-400">{pdfs.length} test papers</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add PDF</button>
      </div>
      {loading && <div className="text-slate-400 text-sm mb-4">Loading...</div>}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Type</th><th>Downloads</th><th>Actions</th></tr></thead>
            <tbody>{pdfs.map(p => (
              <tr key={p.id}>
                <td className="font-medium text-white">{p.title}</td>
                <td><span className="badge badge-green">{p.class}</span></td>
                <td>{p.subject}</td>
                <td>{p.examType}</td>
                <td>{p.downloads || 0}</td>
                <td>
                  <div className="flex gap-2">
                    {p.url && <a href={p.url} target="_blank" rel="noopener" className="text-sm text-green-500 cursor-pointer">View</a>}
                    <button onClick={() => openEdit(p)} className="text-sm text-blue-400 cursor-pointer">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-sm text-red-400 cursor-pointer">Delete</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit PDF' : 'Add PDF'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Class</label><select className="input-field" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>{['Class 8','Class 9','Class 10','Class 11','Class 12','JEE','NEET'].map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label><input className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Exam Type</label><select className="input-field" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}><option>Unit Test</option><option>Chapter Test</option><option>Mock Test</option><option>Practice Paper</option><option>Annual Exam</option><option>Worksheet</option><option>Full Mock</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">PDF URL</label>
            <input className="input-field" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://drive.google.com/..." />
            <p className="text-xs text-slate-500 mt-1">Paste Google Drive / Dropbox / any PDF link</p>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} PDF</button>
        </div>
      </Modal>
    </div>
  );
}
