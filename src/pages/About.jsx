import { motion } from 'framer-motion';
import {
  BookOpenIcon, RocketIcon, HeartPulseIcon, FileTextIcon,
  PlayCircleIcon, TrophyIcon, TargetIcon, TrendingUpIcon
} from '../components/Icons';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

export default function About() {
  const features = [
    { icon: <BookOpenIcon size={28} />, title: 'Classes 8–12', desc: 'Strong foundation in Science and Maths.' },
    { icon: <RocketIcon size={28} />, title: 'IIT-JEE Prep', desc: 'Intensive JEE Main & Advanced coaching.' },
    { icon: <HeartPulseIcon size={28} />, title: 'NEET Prep', desc: 'Comprehensive medical entrance coaching.' },
    { icon: <FileTextIcon size={28} />, title: 'Online Tests', desc: 'Topic-wise and full mock test papers.' },
    { icon: <PlayCircleIcon size={28} />, title: 'Demo Videos', desc: 'Expert video lectures on demand.' },
    { icon: <TrophyIcon size={28} />, title: 'Achievements', desc: 'Top ranks in JEE, NEET, and boards.' },
    { icon: <TargetIcon size={28} />, title: 'Guided Learning', desc: 'Personal mentoring and doubt sessions.' },
    { icon: <TrendingUpIcon size={28} />, title: 'Analytics', desc: 'Data-driven performance tracking.' },
  ];

  return (
    <div className="bg-black">
      <section className="relative pt-28 pb-20 overflow-hidden min-h-[400px] flex items-center">
        {/* Background Image with Blue Transparency */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-1.webp"
            alt="About Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/40 via-[#000000]/60 to-[#000000]"></div>
        </div>

        <div className="container-main relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
          >
            <TrophyIcon size={16} />
            <span>Academic Excellence</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white font-[var(--font-heading)]"
          >
            About RBT Mission Learning
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            A decade of academic excellence shaping tomorrow&apos;s leaders with precision and passion.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div {...fadeUp}>
              <span className="badge badge-green mb-4">Our Journey</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-[var(--font-heading)]">
                Building Strong Foundations <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-brand">Since 2017</span>
              </h2>
              <p className="text-slate-400 mb-5 leading-relaxed text-lg">
                Founded with a vision to make quality education accessible, RBT Mission Learning has grown into one of the most trusted coaching institutes.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Our philosophy — <strong className="text-white font-medium">&ldquo;Mission Hai Toh Perfect Learning Chahiye&rdquo;</strong> — drives everything we do. Over the past decade, we&apos;ve helped thousands excel in board exams and secure admissions in top IITs, AIIMS, and premier institutions through rigorous academics and personal mentoring.
              </p>
              
              {/* Mission/Vision Cards */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="glass-card p-5 border-l-2 border-l-green-brand bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <TargetIcon size={18} className="text-green-brand" /> Our Mission
                  </h4>
                  <p className="text-sm text-slate-400">To provide unparalleled education and mentoring that empowers students to achieve their academic goals.</p>
                </div>
                <div className="glass-card p-5 border-l-2 border-l-blue-500 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <BookOpenIcon size={18} className="text-blue-500" /> Our Vision
                  </h4>
                  <p className="text-sm text-slate-400">To be the most trusted educational institution shaping the leaders and innovators of tomorrow.</p>
                </div>
              </div>
            </motion.div>

            {/* Graphic Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-green-brand/20 to-blue-500/20 rounded-3xl blur-3xl transform -rotate-3"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/5] sm:aspect-square flex items-center justify-center shadow-2xl group">
                {/* Clear Image Display */}
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[url('/Images/Image-2.webp')] bg-cover bg-center transition-transform duration-700"
                ></motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="section-title">What We Offer</h2>
            <p className="section-subtitle">Comprehensive programs and resources</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="glass-card p-6 group hover:-translate-y-2 hover:border-green-brand/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300 border border-transparent cursor-pointer">
                <div className="text-green-brand mb-3 transform group-hover:scale-110 group-hover:text-green-light transition-all duration-300">{f.icon}</div>
                <h3 className="font-bold text-white mb-1 text-sm group-hover:text-green-light transition-colors duration-300">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
