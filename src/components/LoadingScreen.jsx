import { motion } from 'framer-motion';

const title = "RBT MISSION LEARNING".split("");
const tagline = "MISSION HAI TOH PERFECT LEARNING CHAHIYE".split(" ");

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200] overflow-hidden">
      {/* Background Animated Gradient / Glow */}
      <motion.div 
        className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-green-brand/20 rounded-full blur-[80px] md:blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-light rounded-full opacity-0"
          initial={{ 
            y: "110vh", 
            x: `${(Math.random() - 0.5) * 100}vw`,
            scale: Math.random() * 1.5 + 0.5
          }}
          animate={{ 
            y: "-10vh",
            opacity: [0, 0.9, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center w-full px-6 text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, duration: 1 }}
        >
          <motion.img
            src="/Images/RBT Logo.jpeg"
            alt="RBT Mission Learning"
            animate={{ 
              y: [-8, 8, -8],
              boxShadow: [
                "0px 0px 25px rgba(34,197,94,0.3)", 
                "0px 0px 50px rgba(34,197,94,0.6)", 
                "0px 0px 25px rgba(34,197,94,0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 md:w-28 md:h-28 rounded-[1.5rem] md:rounded-[2rem] object-cover mb-6 md:mb-8 border border-white/20"
          />
        </motion.div>

        {/* Staggered Title */}
        <h2 className="text-white font-bold text-lg sm:text-2xl md:text-4xl tracking-[0.1em] sm:tracking-[0.15em] md:tracking-widest mb-4 font-[var(--font-heading)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex flex-wrap justify-center gap-[2px] sm:gap-1 md:gap-1.5">
          {title.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.04, type: "spring" }}
              className={letter === " " ? "w-1.5 sm:w-2 md:w-4" : "inline-block"}
            >
              {letter}
            </motion.span>
          ))}
        </h2>

        {/* Staggered Tagline */}
        <p className="text-green-light text-[10px] sm:text-xs md:text-base tracking-[0.05em] sm:tracking-[0.1em] md:tracking-[0.2em] font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex flex-wrap justify-center gap-x-1.5 sm:gap-x-2 gap-y-1 sm:gap-y-1.5 max-w-[280px] sm:max-w-md text-center opacity-90">
          {tagline.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
            >
              {word}
            </motion.span>
          ))}
        </p>

        {/* Fancy Loading Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 2.0, ease: "easeOut" }}
          className="mt-8 md:mt-12 w-48 sm:w-64 md:w-80 h-[3px] md:h-[4px] bg-white/10 rounded-full overflow-hidden backdrop-blur-md relative border border-white/5"
        >
          {/* Sweeping Highlight */}
          <motion.div
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 2.0 }}
          />
          {/* Progress fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-green-brand to-green-light rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

