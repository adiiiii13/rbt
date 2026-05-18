import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useRealtimeCollection } from '../lib/contentApi';
import { defaultPdfs } from '../data/pdfs';
import { FileTextIcon, DownloadIcon } from '../components/Icons';

export default function TestPapers() {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');
  const { data: testPapers, loading } = useRealtimeCollection('pdfs', 'createdAt', defaultPdfs);

  return (
    <div className={`${isDashboard ? 'bg-[#0a0a0a]' : 'bg-black'} pb-16 min-h-screen relative`}>
      {!isDashboard && (
        <div className="absolute top-0 left-0 w-full h-[500px] z-0 overflow-hidden">
          <img
            src="/Images/Image-1.webp"
            alt="Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/20 via-[#000000]/60 to-[#000000]"></div>
        </div>
      )}

      <div className={`container-main max-w-7xl relative z-10 ${isDashboard ? 'pt-0' : 'pt-32'}`}>
        <div className={`text-center ${isDashboard ? 'mb-8' : 'mb-16'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
          >
            <FileTextIcon size={16} />
            <span>Practice Materials</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            <span className={isDashboard ? "text-white" : "text-white"}>Download</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-brand to-emerald-400">Test Papers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-lg max-w-2xl mx-auto ${isDashboard ? "text-slate-400" : "text-slate-300"}`}
          >
            Prepare for your upcoming examinations with our comprehensive collection of mock tests, previous year papers, and practice materials.
          </motion.p>
        </div>

        {loading && <p className="text-slate-400 text-center py-8">Loading...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testPapers.map((paper, index) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl relative overflow-hidden group border border-white/10 hover:border-green-brand/30 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-brand/10 flex items-center justify-center text-green-brand group-hover:scale-110 transition-all duration-300">
                  <FileTextIcon size={24} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-slate-400">
                  {paper.examType || paper.date || 'Paper'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-brand transition-colors">
                {paper.title}
              </h3>
              <p className="text-slate-400 text-sm mb-1 flex-grow">
                {paper.subject || paper.class || 'General'}
              </p>
              <p className="text-xs text-slate-500 mb-6">{paper.class}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10 relative z-10">
                {paper.url ? (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold bg-green-brand text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-green-brand/20 no-underline">
                    <DownloadIcon size={16} className="text-white" />
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No file</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && testPapers.length === 0 && (
          <p className="text-slate-500 text-center py-12">No test papers available yet.</p>
        )}
      </div>
    </div>
  );
}
