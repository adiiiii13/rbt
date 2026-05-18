import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase')) return 'vendor-firebase'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('qrcode')) return 'vendor-qrcode'
          if (id.includes('animejs')) return 'vendor-anime'
          if (id.includes('react-hot-toast')) return 'vendor-toast'
          if (id.includes('react-player') || id.includes('hls.js') || id.includes('dashjs')) return 'vendor-player'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('scheduler')) return 'vendor-react'
        },
      },
    },
  },
})
