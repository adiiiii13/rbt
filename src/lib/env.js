const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export function validateEnv() {
  const missing = []
  const placeholder = []
  for (const key of REQUIRED) {
    const val = import.meta.env[key]
    if (!val) missing.push(key)
    else if (/^(your_|placeholder)/i.test(val)) placeholder.push(key)
  }
  if (missing.length || placeholder.length) {
    const msg = [
      missing.length ? `Missing env vars: ${missing.join(', ')}` : '',
      placeholder.length ? `Placeholder values: ${placeholder.join(', ')}` : '',
    ].filter(Boolean).join(' | ')
    console.warn(`[env] ${msg}`)
  }
}
