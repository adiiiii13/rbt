import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { addDocument } from '../lib/firebaseHelpers';
import { PhoneIcon, CalendarIcon, MessageSquareIcon } from '../components/Icons';

const MapPinIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const MailIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const CheckCircleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const MapIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" />
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: '', class: '', course: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const cleaned = {
      name: form.name.trim(),
      class: form.class,
      course: form.course,
      phone: form.phone.trim(),
      message: form.message.trim(),
    };
    if (!cleaned.name || !cleaned.phone) {
      toast.error('Name and phone required');
      return;
    }
    if (!/^[0-9+\-\s()]{7,15}$/.test(cleaned.phone)) {
      toast.error('Invalid phone number');
      return;
    }
    const last = Number(localStorage.getItem('rbt_inquiry_last') || 0);
    if (Date.now() - last < 60_000) {
      toast.error('Please wait a minute');
      return;
    }
    setSubmitting(true);
    try {
      await addDocument('inquiries', { ...cleaned, status: 'new' });
      localStorage.setItem('rbt_inquiry_last', String(Date.now()));
      setSubmitted(true);
      setForm({ name: '', class: '', course: '', phone: '', message: '' });
      toast.success('Inquiry submitted');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('[contact]', err);
      toast.error('Submit failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactItems = [
    { icon: <MapPinIcon />, label: 'Address', value: '123 Education Lane, Knowledge City, India - 110001' },
    { icon: <PhoneIcon size={22} />, label: 'Phone', value: '+91 98765 43210' },
    { icon: <MailIcon />, label: 'Email', value: 'info@rbtmission.com' },
    { icon: <CalendarIcon size={22} />, label: 'Hours', value: 'Mon - Sat: 8 AM - 8 PM' },
  ];

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
            Contact Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-slate-200 max-w-2xl mx-auto font-medium"
          >
            Get in touch with us for admissions, queries, or feedback.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-white mb-6">Get In Touch</h2>
              <div className="space-y-5 mb-8">
                {contactItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <span className="text-green-brand mt-0.5 shrink-0 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                    <div><p className="font-semibold text-white text-sm group-hover:text-green-light transition-colors">{item.label}</p><p className="text-slate-400 text-sm">{item.value}</p></div>
                  </div>
                ))}
              </div>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-primary no-underline inline-flex items-center gap-2">
                <MessageSquareIcon size={16} /> WhatsApp Us
              </a>

              {/* Google Map */}
              <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 aspect-video bg-white/5 hover:border-green-brand/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3687.0764037308363!2d88.38053787507437!3d22.46376297956945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0271c4d0e69705%3A0x635cc670b8890e6f!2sRBT%20Mission%20Learning!5e0!3m2!1sen!2sin!4v1778571357875!5m2!1sen!2sin" 
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </motion.div>

            {/* Inquiry Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass-card p-8 group border border-transparent hover:border-green-brand/30 hover:shadow-[0_10px_40px_rgba(34,197,94,0.15)] transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-6">Send an Inquiry</h3>
                {submitted && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-brand text-sm font-medium flex items-center gap-2">
                    <CheckCircleIcon /> Inquiry submitted successfully! We&apos;ll contact you soon.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><label className="text-sm font-medium text-slate-300 mb-1 block">Student Name *</label><input required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/60 transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-slate-300 mb-1 block">Class</label><select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/60 transition-all" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}><option value="" className="text-black">Select</option>{['8','9','10','11','12'].map(c => <option key={c} className="text-black">Class {c}</option>)}</select></div>
                    <div><label className="text-sm font-medium text-slate-300 mb-1 block">Course</label><select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/60 transition-all" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}><option value="" className="text-black">Select</option><option className="text-black">Foundation</option><option className="text-black">IIT-JEE</option><option className="text-black">NEET</option></select></div>
                  </div>
                  <div><label className="text-sm font-medium text-slate-300 mb-1 block">Phone Number *</label><input required type="tel" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/60 transition-all" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><label className="text-sm font-medium text-slate-300 mb-1 block">Message</label><textarea rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-green-brand focus:ring-1 focus:ring-green-brand focus:bg-black/60 transition-all" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-green-brand to-emerald-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Submitting...' : 'Submit Inquiry'} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
