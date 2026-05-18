import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } }
};

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  // Using a mix of local images and high quality placeholder images for the gallery
  const images = [
    { id: 1, src: "/Images/Image-2.webp", alt: "Administration & Faculty", category: "Facilities" },
    { id: 2, src: "/Images/Image-1.webp", alt: "Campus Infrastructure", category: "Campus" },
    { id: 3, src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop", alt: "Students studying", category: "Campus" },
    { id: 4, src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop", alt: "Science lab", category: "Labs" },
    { id: 5, src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop", alt: "Graduation", category: "Events" },
    { id: 6, src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", alt: "Classroom", category: "Campus" },
    { id: 7, src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop", alt: "Tech lab", category: "Labs" },
    { id: 8, src: "https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=800&auto=format&fit=crop", alt: "Campus event", category: "Events" },
  ];

  const categories = ["All", "Campus", "Labs", "Events", "Facilities"];
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredImages = activeCategory === "All" 
    ? images 
    : images.filter(img => img.category === activeCategory);

  return (
    <div className="bg-black min-h-screen relative">
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[350px] flex items-center mb-8">
        {/* Background Image with Blue Transparency */}
        <div className="absolute inset-0 z-0">
          <img
            src="/Images/Image-1.webp"
            alt="Gallery Background"
            width="1214"
            height="911"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/40 via-[#000000]/60 to-[#000000]"></div>
        </div>

        <div className="container-main relative z-10 text-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-brand/10 border border-green-brand/20 text-green-brand text-sm font-medium mb-6"
          >
            <span>Visual Journey</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-[var(--font-heading)]"
          >
            Campus <span className="text-green-brand">Life</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-200 max-w-2xl mx-auto text-lg font-medium"
          >
            Explore our state-of-the-art facilities and vibrant student community through pictures.
          </motion.p>
        </div>
      </section>

      <div className="container-main relative z-10">


        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? "bg-green-brand text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                whileHover={{ y: -12, scale: 1.02, rotate: 1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] bg-white/5 shadow-lg hover:shadow-[0_20px_40px_rgba(34,197,94,0.2)]"
                onClick={() => setSelectedImage(image)}
              >
                <div className="absolute inset-0 bg-green-brand/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 mix-blend-overlay"></div>
                <motion.img 
                  src={image.src} 
                  alt={image.alt} 
                  className="w-full h-full object-cover transition-transform duration-700"
                  whileHover={{ scale: 1.1 }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0">
                  <span className="text-green-brand text-xs font-bold uppercase tracking-wider mb-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">{image.category}</span>
                  <h3 className="text-white font-medium text-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">{image.alt}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-colors z-50"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </motion.button>
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, y: 50, opacity: 0, rotateX: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl perspective-1000"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img 
                layoutId={`img-${selectedImage.id}`}
                src={selectedImage.src} 
                alt={selectedImage.alt} 
                className="w-full h-full object-contain bg-black/50"
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
              >
                <span className="text-green-brand text-sm font-bold uppercase tracking-wider mb-2 block">{selectedImage.category}</span>
                <h3 className="text-white text-xl font-medium">{selectedImage.alt}</h3>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
