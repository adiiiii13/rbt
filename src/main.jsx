import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { validateEnv } from './lib/env.js'

// Suppress noisy Firestore gRPC 404 in dev mode (known SDK bug, doesn't break data)
if (import.meta.env.DEV) {
  const origError = console.error
  console.error = (...args) => {
    if (args[0]?.includes?.('Write/channel') || args[0]?.includes?.('firestore.googleapis.com')) return
    origError(...args)
  }
}

validateEnv()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
