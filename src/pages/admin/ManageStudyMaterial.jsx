import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, deleteDocument, uploadFile } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const TYPES = [
  { value: 'folder', label: '📁 Folder', accept: null },
  { value: 'video', label: '🎬 Video', accept: 'video/*' },
  { value: 'image', label: '🖼 Image', accept: 'image/*' },
  { value: 'pdf', label: '📄 PDF', accept: 'application/pdf' },
];

export default function ManageStudyMaterial() {
  const { data: items, loading } = useRealtimeCollection('studyMaterial', { fallback: [] });
  const [currentFolder, setCurrentFolder] = useState(null);
  const [crumbs, setCrumbs] = useState([{ id: null, name: 'Root' }]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'folder', url: '', subject: '', thumbnail: '' });
  const [uploading, setUploading] = useState(false);

  const children = useMemo(() => items.filter(it => (it.parentId || null) === currentFolder), [items, currentFolder]);

  const openFolder = (folder) => {
    setCurrentFolder(folder.id);
    setCrumbs([...crumbs, { id: folder.id, name: folder.name }]);
  };

  const navCrumb = (idx) => {
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    setCurrentFolder(next[next.length - 1].id);
  };

  const openCreate = () => {
    setForm({ name: '', type: 'folder', url: '', subject: '', thumbnail: '' });
    setModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `studyMaterial/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file);
      setForm(f => ({ ...f, url, name: f.name || file.name }));
      toast.success('Uploaded');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (form.type !== 'folder' && !form.url) { toast.error('Upload file or paste URL'); return; }
    try {
      await addDocument('studyMaterial', {
        ...form,
        parentId: currentFolder,
      });
      toast.success('Added');
      setModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (item) => {
    const hasChildren = items.some(it => it.parentId === item.id);
    if (hasChildren && !confirm(`"${item.name}" has items inside. Delete anyway? (children become orphaned)`)) return;
    if (!hasChildren && !confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteDocument('studyMaterial', item.id);
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Material</h1>
          <p className="text-sm text-slate-400">Folders, videos, images, PDFs — nested unlimited depth</p>
        </div>
        <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">
          + Add Item
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 mb-6 text-sm bg-white/5 border border-white/10 rounded-lg p-3">
        {crumbs.map((c, idx) => (
          <span key={`${c.id}_${idx}`} className="flex items-center gap-1">
            <button
              onClick={() => navCrumb(idx)}
              className={`px-2 py-1 rounded hover:bg-white/10 ${idx === crumbs.length - 1 ? 'text-white font-bold' : 'text-slate-400'}`}
            >
              {c.name}
            </button>
            {idx < crumbs.length - 1 && <span className="text-slate-600">/</span>}
          </span>
        ))}
      </div>

      {loading && <TableSkeleton />}

      {!loading && children.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-3">Empty folder.</p>
          <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white px-5 py-2 rounded-lg">
            Add First Item
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {children.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="text-2xl">
              {item.type === 'folder' ? '📁' : item.type === 'video' ? '🎬' : item.type === 'image' ? '🖼' : '📄'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold truncate">{item.name}</div>
              <div className="text-xs text-slate-500">
                {item.type} {item.subject && `• ${item.subject}`}
              </div>
            </div>
            <div className="flex gap-1">
              {item.type === 'folder' && (
                <button onClick={() => openFolder(item)} className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded">Open</button>
              )}
              <button onClick={() => remove(item)} className="bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded">×</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Item" size="lg">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, type: t.value, url: '' })}
                  className={`p-3 rounded-lg border text-sm ${form.type === t.value ? 'border-green-brand bg-green-brand/10 text-green-brand' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={form.type === 'folder' ? 'e.g. Physics' : 'e.g. Newton Laws Lecture'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          {form.type !== 'folder' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject (optional)</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Mechanics"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Upload File</label>
                <input type="file" accept={TYPES.find(t => t.value === form.type)?.accept}
                  onChange={handleFileUpload} disabled={uploading}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                {uploading && <p className="text-xs text-amber-400 mt-1">Uploading...</p>}
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Or Paste URL</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://... (YouTube, HLS .m3u8, MP4, image, PDF)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>

              {(form.type === 'video') && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Thumbnail URL (optional)</label>
                  <input value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-3 border-t border-white/10">
            <button onClick={() => setModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={save} disabled={uploading} className="flex-1 bg-green-brand hover:bg-green-600 disabled:bg-slate-700 text-white font-bold py-2 rounded-lg">
              Add to "{crumbs[crumbs.length - 1].name}"
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
