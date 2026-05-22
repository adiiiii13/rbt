import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, uploadFile } from '../../lib/firebaseHelpers';
import { defaultPdfs } from '../../data/pdfs';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExportButton from '../../components/ExportButton';

const emptyForm = { title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', url: '', fileName: '', fileSize: 0, description: '' };

// Convert Google Drive share URL to direct download URL
const normalizeUrl = (url) => {
  if (!url) return url;
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
};

const fmtSize = (b) => !b ? '' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(1) + ' KB';

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
      const path = `pdfs/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadFile(path, file);
      setForm({ ...form, url, fileName: file.name, fileSize: file.size });
      toast.success('Uploaded ' + fmtSize(file.size));
    } catch (err) { toast.error('Upload failed: ' + err.message); console.error(err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async () => {
    if (!form.url) { toast.error('Upload a PDF or paste a URL'); return; }
    const payload = { ...form, url: normalizeUrl(form.url), downloads: form.downloads || 0 };
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

  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, class: p.class, subject: p.subject, examType: p.examType, date: p.date || '', url: p.url || '', fileName: p.fileName || '', fileSize: p.fileSize || 0, description: p.description || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage PDFs</h1><p className="text-sm text-slate-400">{pdfs.length} test papers</p></div>
        <div className="flex gap-2">
          <ExportButton data={pdfs} filename="pdfs" columns={[
            { key: 'title', label: 'Title' },
            { key: 'class', label: 'Class' },
            { key: 'subject', label: 'Subject' },
            { key: 'examType', label: 'Exam Type' },
            { key: 'date', label: 'Date' },
            { key: 'url', label: 'URL' },
            { key: 'fileName', label: 'File Name' },
            { key: 'fileSize', label: 'Size' },
            { key: 'downloads', label: 'Downloads' },
            { key: 'description', label: 'Description' },
          ]} />
          <button onClick={() => setModal(true)} className="btn-primary">+ Add PDF</button>
        </div>
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

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Description (optional)</label>
            <textarea rows="2" className="input-field resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description shown to students" />
          </div>

          {/* Upload PDF file */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">PDF File (max 50MB)</label>
            {form.url && form.fileName ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-14 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300 font-bold text-xs">PDF</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{form.fileName}</div>
                  <div className="text-xs text-slate-400">{fmtSize(form.fileSize) || 'Uploaded'}</div>
                </div>
                <button type="button" onClick={() => setForm({...form, url: '', fileName: '', fileSize: 0})} className="text-xs text-red-400 hover:text-red-300 px-2">Remove</button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-green-brand hover:bg-green-brand/5 transition-all block">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-green-brand border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-1">📄</div>
                    <p className="text-sm text-slate-300 font-medium">Click to select PDF</p>
                    <p className="text-xs text-slate-500 mt-1">Max 50MB · PDF only</p>
                  </>
                )}
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Or paste URL */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-3 text-slate-500 text-xs">or paste URL (no storage cost)</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <input className="input-field" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://drive.google.com/file/d/..." />
          <p className="text-xs text-slate-500">Drive share links auto-converted. Use URL for large files to skip storage cost.</p>

          <button onClick={save} disabled={uploading} className="btn-primary w-full disabled:opacity-50">{editing ? 'Update' : 'Add'} PDF</button>
        </div>
      </Modal>
    </div>
  );
}
