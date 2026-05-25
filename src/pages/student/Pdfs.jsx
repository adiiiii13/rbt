import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultPdfs } from '../../data/pdfs';
import { DownloadIcon, FileTextIcon } from '../../components/Icons';

export default function StudentPdfs() {
  const { data: pdfsRaw } = useRealtimeCollection('pdfs', { fallback: defaultPdfs });
  const allPdfs = pdfsRaw?.length ? pdfsRaw : defaultPdfs;
  const [tab, setTab] = useState('free');

  const pdfs = allPdfs.filter(p => tab === 'free' ? p.isFree === true : p.isFree !== true);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          <FileTextIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Test PDFs</h1>
          <p className="text-slate-400 text-sm"><span className="text-green-brand font-bold">Download</span> test papers and practice sets</p>
        </div>
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

      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container bg-[#111111]">
          <table>
            <thead><tr><th className="text-white">Title</th><th className="text-white">Class</th><th className="text-white">Subject</th><th className="text-white">Type</th><th className="text-white">Date</th><th className="text-white">Action</th></tr></thead>
            <tbody>
              {pdfs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No {tab} PDFs yet.</td></tr>
              ) : pdfs.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-white">{p.title}</td>
                  <td><span className="badge badge-green">{p.class}</span></td>
                  <td className="text-slate-300">{p.subject}</td>
                  <td className="text-slate-300">{p.examType}</td>
                  <td className="text-slate-400">{p.date}</td>
                  <td>
                    {p.isFree === true ? (
                      <a
                        href={p.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => { if (!p.url) { e.preventDefault(); alert('No file attached'); } }}
                        className="text-xs font-bold bg-green-brand/10 text-green-brand py-1.5 px-3 rounded-lg hover:bg-green-brand/20 transition-all cursor-pointer inline-flex items-center gap-1.5 border border-green-brand/20 no-underline"
                      >
                        <DownloadIcon size={14} /> Download
                      </a>
                    ) : (
                      <span className="text-xs font-bold bg-amber-500/10 text-amber-400 py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 border border-amber-500/20">
                        🔒 Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
