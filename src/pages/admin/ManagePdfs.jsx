import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers';
import { defaultPdfs } from '../../data/pdfs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const emptyForm = { title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', url: '', fileName: '' };

export default function ManagePdfs() {
  const { data: pdfsRaw, loading } = useRealtimeCollection('pdfs', { fallback: defaultPdfs });
  const pdfs = pdfsRaw?.length ? pdfsRaw : defaultPdfs;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('PDF files only'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max 50MB'); return; }
    setUploading(true);
    try {
      const path = `pdfs/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file);
      setForm({ ...form, url, fileName: file.name });
      toast.success('Uploaded');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.url) { toast.error('Upload a PDF or paste a URL'); return; }
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
    try { await deleteItemSmart('pdfs', id); toast.success('Deleted'); }
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
      {loading && <TableSkeleton />}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th className="text-white">Title</th><th className="text-white">Class</th><th className="text-white">Subject</th><th className="text-white">Type</th><th className="text-white">Downloads</th><th className="text-white">Actions</th></tr></thead>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Class</label><select className="input-field" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>{['Class 8','Class 9','Class 10','Class 11','Class 12','JEE','NEET'].map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label><input className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Exam Type</label><select className="input-field" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}><option>Unit Test</option><option>Chapter Test</option><option>Mock Test</option><option>Practice Paper</option><option>Annual Exam</option><option>Worksheet</option><option>Full Mock</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          </div>

          {/* Upload PDF file */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Upload PDF (max 50MB)</label>
            <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors block">
              {form.fileName ? <p className="text-sm text-green-brand inline-flex items-center gap-1">{form.fileName}</p> : <p className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to select PDF file'}</p>}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {/* Or paste URL */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-3 text-slate-500 text-xs">or paste URL (for large files)</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <input className="input-field" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://drive.google.com/..." />
          <p className="text-xs text-slate-500">Google Drive / Dropbox / any PDF link. For large files use URL.</p>

          <button onClick={save} disabled={uploading} className="btn-primary w-full disabled:opacity-50">{editing ? 'Update' : 'Add'} PDF</button>
        </div>
      </Modal>
    </div>
  );
}
