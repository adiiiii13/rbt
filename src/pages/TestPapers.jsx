import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FileTextIcon, DownloadIcon } from '../components/Icons';

const CATEGORIES = [
  {
    id: 'downloadable',
    title: 'Downloadable Test Papers',
    desc: 'Previous year question papers, sample papers, solution sets — all PDFs you can download and practice offline.',
    icon: DownloadIcon,
    color: 'green-brand',
    gradient: 'from-green-brand/20 to-emerald-500/10',
    cta: 'Browse PDFs',
    href: 'downloadable',
  },
  {
    id: 'mock',
    title: 'Online Mock Tests',
    desc: 'Interactive MCQ tests with timer, instant scoring, and detailed solutions. Practice JEE Main, NEET, Class 8-12 papers.',
    icon: FileTextIcon,
    color: 'blue-400',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    cta: 'Take Mock Test',
    href: 'mock',
  },
];

export default function TestPapers() {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/admin');
  const base = isDashboard ? location.pathname.replace(/\/?$/, '') : '/test-papers';

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

      <div className={`container-main max-w-6xl relative z-10 ${isDashboard ? 'pt-0' : 'pt-32'}`}>
        <div className={`text-center ${isDashboard ? 'mb-8' : 'mb-16'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
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
            <span className="text-white">Test</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-brand to-emerald-400">Papers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto text-slate-300"
          >
            Pick your practice format — download PDFs to study offline, or take an interactive mock test with timer and instant results.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Link
                  to={`${base}/${cat.href}`}
                  className="group block relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 no-underline"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />

                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-${cat.color}/15 border border-${cat.color}/20 flex items-center justify-center text-${cat.color} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon size={32} />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{cat.title}</h2>
                    <p className="text-slate-300 leading-relaxed mb-6">{cat.desc}</p>

                    <div className={`inline-flex items-center gap-2 text-${cat.color} font-bold group-hover:gap-3 transition-all`}>
                      {cat.cta}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
