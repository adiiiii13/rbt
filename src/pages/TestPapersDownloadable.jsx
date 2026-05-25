import { GridSkeleton } from '../components/ui/Skeleton';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useRealtimeCollection } from '../lib/useRealtimeCollection';
import { defaultPdfs } from '../data/pdfs';
import { FileTextIcon, DownloadIcon } from '../components/Icons';

const FILTERS = ['All', 'JEE Main', 'NEET', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Boards'];

export default function TestPapersDownloadable() {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');
  const backTo = isDashboard ? location.pathname.replace(/\/downloadable\/?$/, '') : '/test-papers';

  const { data: pdfsRaw, loading } = useRealtimeCollection('pdfs', { fallback: defaultPdfs });
  const allPdfs = pdfsRaw?.length ? pdfsRaw : defaultPdfs;
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('free');

  const filtered = allPdfs.filter(p => {
    const matchesTab = tab === 'free' ? p.isFree === true : p.isFree !== true;
    const matchesFilter = filter === 'All'
      || (p.category && p.category.toLowerCase().includes(filter.toLowerCase()))
      || (p.examType && p.examType.toLowerCase().includes(filter.toLowerCase()))
      || (p.class && p.class.toLowerCase().includes(filter.toLowerCase()))
      || (p.title && p.title.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch = !search
      || p.title?.toLowerCase().includes(search.toLowerCase())
      || p.subject?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesFilter && matchesSearch;
  });

  return (
    <div className={`${isDashboard ? 'bg-[#0a0a0a]' : 'bg-black'} pb-16 min-h-screen relative`}>
      <div className={`container-main max-w-7xl relative z-10 ${isDashboard ? 'pt-0' : 'pt-32'}`}>
        <Link to={backTo} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 no-underline text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Test Papers
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Downloadable Test Papers</h1>
          <p className="text-slate-400">PDFs for offline practice — previous years, sample papers, solutions.</p>
        </div>

        {/* Paid / Free tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setTab('free')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'free' ? 'border-green-brand text-green-brand' : 'border-transparent text-slate-500 hover:text-white'}`}
          >
            Free
          </button>
          <button
            onClick={() => setTab('paid')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'paid' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-500 hover:text-white'}`}
          >
            Paid
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search papers..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-colors"
          />
        </div>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Filter by Level</p>
          <div className="flex flex-wrap gap-2.5">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`group inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                  filter === f
                    ? 'bg-green-brand text-white border border-green-400/40'
                    : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                  filter === f ? 'bg-white' : 'bg-slate-600 group-hover:bg-green-brand'
                }`} />
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && <GridSkeleton count={6} type="card" />}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <FileTextIcon size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No papers match your filter.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((paper, idx) => (
            <motion.div
              key={paper.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl group border border-white/10 hover:border-green-brand/30 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-brand/10 flex items-center justify-center text-green-brand group-hover:scale-110 transition-transform">
                  <FileTextIcon size={24} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-slate-400">
                  {paper.examType || paper.category || paper.class || 'Paper'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{paper.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{paper.subject} {paper.year && `• ${paper.year}`}</p>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-slate-500">{paper.pages ? `${paper.pages} pages` : paper.size || 'PDF'}</span>
                {paper.isFree === true ? (
                  <a
                    href={paper.url || paper.fileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-green-brand hover:text-emerald-400 no-underline"
                    onClick={e => { if (!paper.url && !paper.fileUrl) e.preventDefault(); }}
                  >
                    <DownloadIcon size={16} /> Download
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400">
                    🔒 Paid
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
