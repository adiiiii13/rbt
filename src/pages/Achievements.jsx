import { motion } from 'framer-motion';
import { useRealtimeCollection } from '../lib/contentApi';
import { defaultAchievements } from '../data/achievements';
import { TrophyIcon } from '../components/Icons';

export default function Achievements() {
  const { data: achievements } = useRealtimeCollection('achievements', 'createdAt', defaultAchievements);
  return (
    <div>
      <section className="relative pt-32 pb-20 overflow-hidden bg-navy">
        {/* Standardized Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-1.webp"
            alt="Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="container-main relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-3xl lg:text-5xl font-bold mb-4 font-[var(--font-heading)] text-white"
          >
            Student Achievements
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-slate-200 max-w-2xl mx-auto font-medium"
          >
            Our students consistently deliver outstanding results.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {achievements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass-card p-6 text-center group hover:-translate-y-2 hover:border-green-brand/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 border border-transparent cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-green-brand/10 flex items-center justify-center text-green-brand mx-auto mb-4 transform group-hover:scale-110 group-hover:bg-green-brand/20 transition-all duration-300"><TrophyIcon size={28} /></div>
                <h3 className="font-bold text-white mb-1 group-hover:text-green-light transition-colors duration-300">{a.studentName}</h3>
                <p className="text-green-brand font-semibold text-lg mb-1">{a.result}</p>
                <p className="text-slate-400 text-sm mb-1">{a.course}</p>
                <p className="text-slate-400 text-xs mb-3">{a.marks}</p>
                <p className="text-slate-400 text-sm mb-3">{a.description}</p>
                <span className="badge badge-gold">{a.year}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
