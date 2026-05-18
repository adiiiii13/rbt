import { motion } from 'framer-motion'
import CounsellingForm from '../components/CounsellingForm'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
}

export default function Counselling() {
  return (
    <div className="bg-black">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden min-h-[350px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img src="/Images/Image-1.webp" alt="Background" width="1214" height="911" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/40 via-[#000000]/60 to-[#000000]" />
        </div>

        {/* Glowing orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-green-brand/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="container-main relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/></svg>
            <span>Student Support</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 font-[var(--font-heading)] text-white"
          >
            Counselling Room
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 max-w-2xl mx-auto text-lg"
          >
            Book a private counselling session with our expert mentors
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-20 bg-[#000000]">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Info */}
            <motion.div {...fadeUp}>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">Why Counselling?</h2>
              <div className="space-y-4 mb-8">
                {[
                  { title: 'Academic Guidance', desc: 'Get personalized study plans and exam strategies from experienced mentors.' },
                  { title: 'Career Planning', desc: 'Explore career paths in engineering, medicine, research, and more.' },
                  { title: 'Parent-Student Support', desc: 'Joint sessions for parents and students to align on goals and expectations.' },
                  { title: 'Stress Management', desc: 'Learn techniques to manage exam pressure and maintain mental well-being.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-green-brand/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-brand/10 text-green-brand flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-green-brand/20 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6 border border-white/[0.06]"
              >
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-brand"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  How It Works
                </h3>
                <ol className="space-y-3 text-sm text-slate-400">
                  {[
                    'Fill the booking form',
                    'We confirm your slot via phone/WhatsApp',
                    'Get a Google Meet link for your session',
                    'Join the video call with student & parent',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-brand/10 text-green-brand flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-card p-6 lg:p-8 border border-white/[0.06] hover:border-green-brand/10 transition-all sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-green-brand rounded-full" />
                  Book a Session
                </h3>
                <CounsellingForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
