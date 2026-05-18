import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function OfferPopup() {
  const [offer, setOffer] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('rbt_offer_dismissed')) {
      setDismissed(true);
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const q = query(
          collection(db, 'offers'),
          where('active', '==', true),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!alive || snap.empty) return;

        const doc = snap.docs[0];
        const data = { id: doc.id, ...doc.data() };

        // Check date range
        const now = new Date();
        if (data.startDate && new Date(data.startDate) > now) return;
        if (data.endDate && new Date(data.endDate) < now) return;

        setOffer(data);
      } catch { /* offer popup is non-critical */ }
    };
    load();
    return () => { alive = false; };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('rbt_offer_dismissed', '1');
  };

  const openWhatsApp = () => {
    if (!offer) return;
    const msg = encodeURIComponent(offer.whatsappMessage || `Hi! I saw your offer: ${offer.title}`);
    window.open(`https://wa.me/${offer.whatsappPhone}?text=${msg}`, '_blank');
    dismiss();
  };

  if (!offer || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm relative overflow-hidden rounded-3xl shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${offer.bgColor || '#16a34a'}, ${offer.bgColor || '#16a34a'}88)` }}
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-1.5 bg-black/20 rounded-full px-4 py-1.5 mb-5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Special Offer</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">{offer.title}</h3>
            <p className="text-white/90 text-sm leading-relaxed mb-6">{offer.message}</p>

            <button
              onClick={openWhatsApp}
              className="w-full bg-white text-green-700 font-bold py-3.5 px-6 rounded-2xl hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enquire on WhatsApp
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
