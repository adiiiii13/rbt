import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function OfferPopup() {
  const [offer, setOffer] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('rbt_offer_dismissed')) { setDismissed(true); return; }
    let alive = true;
    const load = async () => {
      try {
        const q = query(collection(db, 'offers'), where('active', '==', true), limit(1));
        const snap = await getDocs(q);
        if (!alive || snap.empty) return;
        const doc = snap.docs[0];
        setOffer({ id: doc.id, ...doc.data() });
      } catch { /* non-critical */ }
    };
    load();
    return () => { alive = false; };
  }, []);

  const dismiss = () => { setDismissed(true); sessionStorage.setItem('rbt_offer_dismissed', '1'); };

  const openWhatsApp = () => {
    if (!offer) return;
    const msg = encodeURIComponent(offer.whatsappMessage || `Hi! I saw your offer: ${offer.title}`);
    window.open(`https://wa.me/${offer.whatsappPhone}?text=${msg}`, '_blank');
    dismiss();
  };

  if (!offer || dismissed) return null;

  const bg = offer.bgColor || '#16a34a';
  const bg2 = offer.bgColor2 || '#0ea5e9';
  const template = offer.template || 'classic';
  const cta = offer.ctaText || 'Enquire on WhatsApp';

  const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  );

  // ===== TEMPLATE 1: Classic Centered =====
  if (template === 'classic') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 bg-black/70 backdrop-blur-sm" onClick={dismiss}>
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-md relative overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg2} 50%, #0d1117 100%)` }}>
            <button onClick={dismiss} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/30 text-white/70 hover:text-white flex items-center justify-center cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative p-8 text-center">
              {offer.badge && <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{offer.badge}</span>
              </div>}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{offer.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">{offer.message}</p>
              <button onClick={openWhatsApp} className="w-full bg-white hover:bg-white/90 text-green-700 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg cursor-pointer">
                <WhatsAppIcon /> {cta}
              </button>
              <p className="text-white/30 text-xs mt-4 cursor-pointer hover:text-white/50" onClick={dismiss}>Not now</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ===== TEMPLATE 2: Fullscreen Overlay =====
  if (template === 'fullscreen') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center" onClick={dismiss}
          style={{ background: `linear-gradient(135deg, ${bg}ee, ${bg2}ee)`, backdropFilter: 'blur(20px)' }}>
          <button onClick={dismiss} className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/20 text-white/60 hover:text-white flex items-center justify-center cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="text-center max-w-lg px-8" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4">🎓</div>
            {offer.badge && <span className="inline-block bg-black/30 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">{offer.badge}</span>}
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{offer.title}</h3>
            <p className="text-white/90 text-lg mb-8">{offer.message}</p>
            <button onClick={openWhatsApp} className="bg-white text-green-700 font-bold py-4 px-10 rounded-2xl text-lg flex items-center justify-center gap-3 mx-auto shadow-xl cursor-pointer hover:scale-105 transition-transform">
              <WhatsAppIcon /> {cta}
            </button>
            <p className="text-white/40 text-sm mt-6 cursor-pointer hover:text-white/60" onClick={dismiss}>Maybe later</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ===== TEMPLATE 3: Bottom Bar =====
  if (template === 'bottombar') {
    return (
      <AnimatePresence>
        <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[500] p-4" style={{ background: `linear-gradient(90deg, ${bg}, ${bg2})` }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/20 items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div className="min-w-0">
                {offer.badge && <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{offer.badge}</span>}
                <h3 className="text-white font-bold text-base truncate">{offer.title}</h3>
                <p className="text-white/80 text-sm truncate">{offer.message}</p>
              </div>
            </div>
            <button onClick={openWhatsApp} className="bg-white text-green-700 font-bold py-3 px-6 rounded-xl flex items-center gap-2 shrink-0 cursor-pointer hover:bg-white/90 transition">
              <WhatsAppIcon /> {cta}
            </button>
            <button onClick={dismiss} className="text-white/60 hover:text-white shrink-0 cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ===== TEMPLATE 4: Side Panel =====
  if (template === 'side') {
    return (
      <AnimatePresence>
        <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[500] shadow-2xl"
          style={{ background: `linear-gradient(180deg, ${bg}f0, ${bg2}f0, #0d1117f0)` }}>
          <button onClick={dismiss} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 text-white/70 hover:text-white flex items-center justify-center cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="p-8 pt-20 h-full flex flex-col justify-center">
            <div className="text-5xl mb-4">🎯</div>
            {offer.badge && <span className="inline-block bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 w-fit">{offer.badge}</span>}
            <h3 className="text-3xl font-black text-white mb-3">{offer.title}</h3>
            <p className="text-white/80 text-base mb-8 leading-relaxed">{offer.message}</p>
            <button onClick={openWhatsApp} className="w-full bg-white text-green-700 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg cursor-pointer hover:bg-white/90 transition">
              <WhatsAppIcon /> {cta}
            </button>
            <p className="text-white/30 text-sm text-center mt-4 cursor-pointer hover:text-white/50" onClick={dismiss}>Dismiss</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ===== TEMPLATE 5: Card Float =====
  if (template === 'card') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={dismiss}>
          <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#111111] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            {/* Colored top strip */}
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${bg}, ${bg2})` }} />
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                {offer.badge && <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                  style={{ background: `${bg}22`, color: bg }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {offer.badge}
                </span>}
                <button onClick={dismiss} className="text-slate-500 hover:text-white cursor-pointer ml-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{offer.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{offer.message}</p>
              <button onClick={openWhatsApp} className="w-full font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:opacity-90 transition text-white shadow-lg"
                style={{ background: `linear-gradient(90deg, ${bg}, ${bg2})` }}>
                <WhatsAppIcon /> {cta}
              </button>
              <p className="text-slate-600 text-xs text-center mt-4 cursor-pointer hover:text-slate-400" onClick={dismiss}>No thanks</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default fallback
  return null;
}
