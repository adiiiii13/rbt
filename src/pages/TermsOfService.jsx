import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-20 overflow-hidden bg-navy">
        {/* Standardized Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-2.webp"
            alt="Background"
            width="685"
            height="559"
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
            Terms of Service
          </motion.h1>
        </div>
      </section>

      <div className="container-main max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 rounded-2xl relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-brand/10 rounded-full blur-[80px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10" />

          <div className="prose prose-invert prose-green max-w-none">
            <p className="text-slate-300 text-lg mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                By accessing and using the RBT Mission Learning website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Educational Services</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                We provide online and offline educational content, courses, and materials. We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Conduct</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                You agree not to use our services for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Academic dishonesty, sharing of premium accounts, or distribution of our copyrighted materials is strictly prohibited.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Intellectual Property</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                All content on this website, including text, graphics, logos, videos, and course materials, is the property of RBT Mission Learning and is protected by intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Limitation of Liability</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                RBT Mission Learning shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
