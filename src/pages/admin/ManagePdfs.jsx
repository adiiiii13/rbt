import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/contentApi';
import { addDocument, updateDocument, deleteDocument, uploadFile } from '../../lib/firebaseHelpers';
import { defaultPdfs } from '../../data/pdfs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { FileTextIcon } from '../../components/Icons';

const emptyForm = { title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', fileName: '', url: '' };

export default function ManagePdfs() {
  const { data: pdfs, loading } = useRealtimeCollection('pdfs', 'createdAt', defaultPdfs);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('PDF only'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setUploading(true);
    try {
      const path = `pdfs/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file);
      setForm({ ...form, fileName: file.name, url });
      toast.success('Uploaded');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.url && !editing?.url) { toast.error('Upload a PDF first'); return; }
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

  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, class: p.class, subject: p.subject, examType: p.examType, date: p.date || '', fileName: p.fileName || '', url: p.url || '' }); setModal(true); };
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
                <td><div className="flex gap-2"><button onClick={() => openEdit(p)} className="text-sm text-blue-600 cursor-pointer">Edit</button><button onClick={() => remove(p.id)} className="text-sm text-red-600 cursor-pointer">Delete</button></div></td>
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
            <label className="text-sm font-medium text-slate-300 mb-1 block">Upload PDF (max 10MB)</label>
            <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
              {form.fileName ? <p className="text-sm text-green-brand inline-flex items-center gap-1"><FileTextIcon size={14} /> {form.fileName}</p> : <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to select PDF file'}</p>}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          <button onClick={save} className="btn-primary w-full" disabled={uploading}>{editing ? 'Update' : 'Add'} PDF</button>
        </div>
      </Modal>
    </div>
  );
}
