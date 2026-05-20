import { Link } from 'react-router-dom';
import { PhoneIcon, CalendarIcon } from './Icons';

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const MailIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const ChevronUpIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-navy text-white relative">
      {/* Wave Divider */}
      <div className="absolute -top-1 left-0 right-0 overflow-hidden transform -translate-y-[1px]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px]">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,40 1440,30 L1440,60 L0,60 Z" fill="#0a1628"/>
        </svg>
      </div>

      <div className="container-main pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-green-brand/20 rounded-xl blur opacity-50" />
                <img src="/Images/RBT Logo.jpeg" alt="RBT Mission Learning" width="40" height="40" loading="lazy" decoding="async" className="relative w-10 h-10 rounded-xl object-cover" />
              </div>
              <div>
                <h3 className="text-base font-bold">RBT MISSION</h3>
                <p className="text-[10px] font-medium tracking-widest text-green-light">LEARNING</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-xs">
              Mission Hai Toh Perfect Learning Chahiye. Building strong foundations for academic excellence since 2017.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Facebook', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                { label: 'Instagram', paths: ['M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', 'M17.5 6.5h.01'], rect: true },
                { label: 'YouTube', path: 'm10 15 5-3-5-3z', yt: true },
              ].map((s, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-green-brand hover:border-green-brand transition-all text-slate-400 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.rect && <rect width="20" height="20" x="2" y="2" rx="5" />}
                    {s.yt && <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />}
                    <path d={s.path} />
                    {s.paths && s.paths.map((p, j) => <path key={j} d={p} />)}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-green-light mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/courses', label: 'Courses' },
                { to: '/videos', label: 'Demo Videos' },
                { to: '/achievements', label: 'Achievements' },
                { to: '/counselling', label: 'Counselling' },
                { to: '/contact', label: 'Contact' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-slate-400 hover:text-white hover:pl-1 text-sm transition-all no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-green-light mb-4">Our Courses</h4>
            <div className="flex flex-col gap-2">
              {[
                'Foundation (8-10)',
                'Class 11 Science',
                'Class 12 Science',
                'IIT-JEE Preparation',
                'NEET Preparation',
              ].map((course) => (
                <span key={course} className="text-slate-400 text-sm">{course}</span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-green-light mb-4">Contact Info</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="text-green-brand mt-0.5 shrink-0"><MapPinIcon /></span>
                <p className="text-slate-400 text-sm">123 Education Lane, Knowledge City, India - 110001</p>
              </div>
              <a href="tel:+919876543210" className="flex items-center gap-3 no-underline text-slate-400 hover:text-white transition-colors">
                <span className="text-green-brand shrink-0"><PhoneIcon size={18} /></span>
                <p className="text-sm">+91 98765 43210</p>
              </a>
              <a href="mailto:info@rbtmission.com" className="flex items-center gap-3 no-underline text-slate-400 hover:text-white transition-colors">
                <span className="text-green-brand shrink-0"><MailIcon /></span>
                <p className="text-sm">info@rbtmission.com</p>
              </a>
              <div className="flex items-center gap-3">
                <span className="text-green-brand shrink-0"><CalendarIcon size={18} /></span>
                <p className="text-slate-400 text-sm">Mon - Sat: 8 AM - 8 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="container-main py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center sm:text-left">
            © 2026 RBT Mission Learning. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/privacy" className="text-slate-500 hover:text-white text-sm transition-colors no-underline">Privacy</Link>
            <Link to="/terms" className="text-slate-500 hover:text-white text-sm transition-colors no-underline">Terms</Link>
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-green-brand hover:border-green-brand transition-all cursor-pointer"
              aria-label="Back to top"
            >
              <ChevronUpIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
