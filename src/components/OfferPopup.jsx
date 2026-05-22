import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function OfferPopup() {
  const [offer, setOffer] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('rbt_offer_dismissed')) { setDismissed(true); return }
    let alive = true
    const load = async () => {
      try {
        const q = query(collection(db, 'offers'), where('active', '==', true), limit(1))
        const snap = await getDocs(q)
        if (!alive || snap.empty) return
        setOffer({ id: snap.docs[0].id, ...snap.docs[0].data() })
      } catch {}
    }
    load()
    return () => { alive = false }
  }, [])

  const dismiss = () => { setDismissed(true); sessionStorage.setItem('rbt_offer_dismissed', '1') }

  const openWhatsApp = () => {
    if (!offer) return
    const msg = encodeURIComponent(offer.whatsappMessage || `Hi! I saw your offer: ${offer.title}`)
    window.open(`https://wa.me/${offer.whatsappPhone}?text=${msg}`, '_blank')
    dismiss()
  }

  if (!offer || dismissed) return null

  const template = offer.template || 'classic'
  const bg = offer.bgColor || '#16a34a'
  const bg2 = offer.bgColor2 || '#0ea5e9'

  const Img = () => offer.imageUrl ? (
    <img src={offer.imageUrl} alt="" className="w-full max-h-40 object-cover rounded-xl mb-4 shadow-lg" loading="lazy" />
  ) : null

  const Close = () => (
    <button onClick={dismiss} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/30 text-white/70 hover:text-white flex items-center justify-center cursor-pointer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  )

  const CTA = ({ className = '' }) => (
    <button onClick={openWhatsApp} className={`font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      {offer.ctaText || 'Enquire on WhatsApp'}
    </button>
  )

  // ===== TEMPLATE 1: Classic centered popup =====
  if (template === 'classic') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={dismiss}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-md relative overflow-hidden rounded-3xl"
            style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg2} 50%, #0d1117 100%)` }}>
            <Close />
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative p-8 text-center">
              <Img />
              {offer.badge && <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{offer.badge}</span>
              </div>}
              <h3 className="text-3xl font-bold text-white mb-3">{offer.title}</h3>
              <p className="text-white/80 text-sm mb-6">{offer.message}</p>
              <CTA className="w-full bg-white text-green-700 py-4 px-6 rounded-2xl shadow-lg" />
              <p className="text-white/30 text-xs mt-4 cursor-pointer hover:text-white/50" onClick={dismiss}>Not now</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ===== TEMPLATE 2: Fullscreen takeover =====
  if (template === 'fullscreen') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center"
          onClick={dismiss} style={{ background: `linear-gradient(135deg, ${bg}ee, ${bg2}ee)`, backdropFilter: 'blur(30px)' }}>
          <Close />
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }} onClick={e => e.stopPropagation()}
            className="text-center max-w-lg px-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎓</span>
            </motion.div>
            {offer.badge && <span className="inline-block bg-black/30 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider mb-4">{offer.badge}</span>}
            <Img />
            <h3 className="text-5xl font-black text-white mb-4 leading-tight">{offer.title}</h3>
            <p className="text-white/90 text-lg mb-8">{offer.message}</p>
            <CTA className="bg-white text-green-700 py-4 px-10 rounded-2xl text-lg shadow-xl" />
            <p className="text-white/40 text-sm mt-6 cursor-pointer hover:text-white/60" onClick={dismiss}>Maybe later</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ===== TEMPLATE 3: Bottom bar =====
  if (template === 'bottombar') {
    return (
      <AnimatePresence>
        <motion.div initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
          transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 z-[500]">
          <div className="mx-4 mb-4 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${bg}, ${bg2})` }}>
            <div className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-300"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                {offer.badge && <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{offer.badge}</span>}
                <h3 className="text-white font-bold truncate">{offer.title}</h3>
                <p className="text-white/80 text-sm truncate">{offer.message}</p>
              </div>
              <CTA className="bg-white text-green-700 font-bold py-3 px-5 rounded-xl shrink-0 text-sm" />
              <button onClick={dismiss} className="text-white/60 hover:text-white shrink-0 cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ===== TEMPLATE 4: Side panel =====
  if (template === 'side') {
    return (
      <AnimatePresence>
        <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[500] shadow-2xl"
          style={{ background: `linear-gradient(180deg, ${bg}f0, ${bg2}f0, #0d1117f0)` }}>
          <Close />
          <div className="p-8 pt-20 h-full flex flex-col justify-center">
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Img />
              {offer.badge && <span className="inline-block bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3">{offer.badge}</span>}
              <h3 className="text-3xl font-black text-white mb-3">{offer.title}</h3>
              <p className="text-white/80 text-base mb-8 leading-relaxed">{offer.message}</p>
              <CTA className="w-full bg-white text-green-700 py-4 px-6 rounded-2xl shadow-lg" />
              <p className="text-white/30 text-sm text-center mt-4 cursor-pointer hover:text-white/50" onClick={dismiss}>Dismiss</p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ===== TEMPLATE 5: Split banner (image left, text right) =====
  if (template === 'split') {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={dismiss}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#111111] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col sm:flex-row">
            {/* Left: image or gradient */}
            <div className="sm:w-2/5 p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden"
              style={{ background: offer.imageUrl ? '#000' : `linear-gradient(180deg, ${bg}, ${bg2})` }}>
              {offer.imageUrl ? (
                <img src={offer.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="text-6xl mb-3">🎉</div>
              )}
              {offer.badge && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-block bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{offer.badge}</span>}
            </div>
            {/* Right: content */}
            <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col justify-center">
              <button onClick={dismiss} className="self-end text-slate-500 hover:text-white mb-4 cursor-pointer sm:mb-0 sm:absolute sm:top-4 sm:right-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <h3 className="text-2xl font-bold text-white mb-2">{offer.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{offer.message}</p>
              <CTA className="w-full text-green-700 font-bold py-3 px-6 rounded-2xl"
                style={{ background: `linear-gradient(90deg, ${bg}, ${bg2})`, color: '#fff' }} />
              <p className="text-slate-600 text-xs text-center mt-3 cursor-pointer hover:text-slate-400" onClick={dismiss}>Not now</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Default: classic
  return null
}
