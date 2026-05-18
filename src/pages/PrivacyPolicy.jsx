import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
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
            Privacy Policy
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                At RBT Mission Learning, we collect information that you provide directly to us, such as when you create an account, enroll in a course, or communicate with us. This may include your name, email address, phone number, and educational background.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                We use the information we collect to provide, maintain, and improve our educational services, to process your transactions, and to communicate with you about your account, courses, and promotional offers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures designed to protect your personal information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf, strictly under confidentiality agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Us</h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us at info@rbtmission.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
