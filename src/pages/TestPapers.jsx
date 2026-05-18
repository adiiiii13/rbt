import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { FileTextIcon, DownloadIcon } from '../components/Icons';

const testPapers = [
  {
    id: 1,
    title: "JEE Main Full Syllabus Mock Test",
    subject: "Physics, Chemistry, Mathematics",
    date: "May 2026",
    size: "2.4 MB"
  },
  {
    id: 2,
    title: "NEET Biology Grand Test",
    subject: "Biology",
    date: "April 2026",
    size: "1.8 MB"
  },
  {
    id: 3,
    title: "Class 12 Physics Board Pattern",
    subject: "Physics",
    date: "March 2026",
    size: "1.2 MB"
  },
  {
    id: 4,
    title: "Class 11 Chemistry Half Yearly",
    subject: "Chemistry",
    date: "October 2025",
    size: "3.1 MB"
  },
  {
    id: 5,
    title: "Foundation Class 10 Math",
    subject: "Mathematics",
    date: "August 2025",
    size: "1.5 MB"
  },
  {
    id: 6,
    title: "JEE Advanced Practice Paper 1",
    subject: "Physics, Chemistry, Mathematics",
    date: "July 2025",
    size: "4.2 MB"
  }
];

export default function TestPapers() {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');

  return (
    <div className={`${isDashboard ? 'bg-white' : 'bg-black'} pb-16 min-h-screen relative`}>
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
            <span className={isDashboard ? "text-navy" : "text-white"}>Download</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-brand to-emerald-400">Test Papers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-lg max-w-2xl mx-auto ${isDashboard ? "text-slate-600" : "text-slate-300"}`}
          >
            Prepare for your upcoming examinations with our comprehensive collection of mock tests, previous year papers, and practice materials.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testPapers.map((paper, index) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl relative overflow-hidden group border border-slate-200 hover:border-green-brand/30 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-green-brand group-hover:scale-110 group-hover:bg-green-brand/10 transition-all duration-300">
                  <FileTextIcon size={24} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  {paper.date}
                </span>
              </div>

              <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-green-brand transition-colors">
                {paper.title}
              </h3>
              <p className="text-slate-500 text-sm mb-6 flex-grow">
                {paper.subject}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 relative z-10">
                <span className="text-sm text-slate-400">{paper.size} • PDF</span>
                <button className="flex items-center gap-2 text-sm font-bold bg-green-brand text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-green-brand/20 cursor-pointer">
                  <DownloadIcon size={16} className="text-white" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
