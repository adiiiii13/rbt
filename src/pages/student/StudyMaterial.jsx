import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import HlsPlayer from '../../components/HlsPlayer';
import { useAuth } from '../../context/AuthContext';

function Icon({ type }) {
  const map = {
    folder: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      </svg>
    ),
    video: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    ),
    image: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
    ),
    pdf: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    ),
  };
  return map[type] || map.folder;
}

const COLORS = {
  folder: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  video: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  image: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  pdf: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function StudyMaterial() {
  const { user } = useAuth();
  const { data: items, loading } = useRealtimeCollection('studyMaterial', { fallback: [] });
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [crumbs, setCrumbs] = useState([{ id: null, name: 'Study Material' }]);
  const [previewItem, setPreviewItem] = useState(null);

  const children = useMemo(() => {
    return items.filter(it => (it.parentId || null) === currentFolder);
  }, [items, currentFolder]);

  const folders = children.filter(c => c.type === 'folder');
  const files = children.filter(c => c.type !== 'folder');

  const openFolder = (folder) => {
    setCurrentFolder(folder.id);
    setCrumbs([...crumbs, { id: folder.id, name: folder.name }]);
  };

  const navCrumb = (idx) => {
    const newCrumbs = crumbs.slice(0, idx + 1);
    setCrumbs(newCrumbs);
    setCurrentFolder(newCrumbs[newCrumbs.length - 1].id);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Study Material</h1>
      <p className="text-slate-400 text-sm mb-4">Videos, notes, photos — organized in folders</p>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 mb-6 text-sm">
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

      {loading && <p className="text-slate-400 text-center py-8">Loading...</p>}

      {!loading && children.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-600 mb-3">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
          </svg>
          <p className="text-slate-400">This folder is empty.</p>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <>
          <div className="text-xs uppercase text-slate-500 font-bold mb-2">Folders ({folders.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {folders.map((f, idx) => (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => openFolder(f)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-105 ${COLORS.folder}`}
              >
                <Icon type="folder" />
                <div className="text-left min-w-0">
                  <div className="font-bold truncate">{f.name}</div>
                  <div className="text-xs opacity-70">
                    {items.filter(it => it.parentId === f.id).length} items
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* Files */}
      {files.length > 0 && (
        <>
          <div className="text-xs uppercase text-slate-500 font-bold mb-2">Files ({files.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((file, idx) => (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setPreviewItem(file)}
                className={`text-left rounded-xl border overflow-hidden hover:scale-105 transition-all ${COLORS[file.type] || COLORS.video}`}
              >
                {file.thumbnail ? (
                  <img src={file.thumbnail} alt="" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <Icon type={file.type} />
                  </div>
                )}
                <div className="p-3">
                  <div className="font-bold text-sm line-clamp-2">{file.name}</div>
                  {file.subject && <div className="text-xs opacity-70 mt-1">{file.subject}</div>}
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* Preview modal */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="max-w-5xl w-full max-h-[90vh] bg-[#0a1628] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-bold truncate">{previewItem.name}</h3>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white px-3 py-1">✕</button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              {previewItem.type === 'video' && (
                <HlsPlayer url={previewItem.url} watermark={user?.email || 'RBT'} />
              )}
              {previewItem.type === 'image' && (
                <img src={previewItem.url} alt={previewItem.name} className="w-full h-auto" />
              )}
              {previewItem.type === 'pdf' && (
                <iframe src={previewItem.url} className="w-full h-[80vh]" title={previewItem.name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
