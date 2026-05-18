import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Global state: one subscription per collection, shared across components
const state = {} // { [name]: { data: [], loading: true, listeners: Set, unsub: fn|null } }

function mergeWithDefaults(firestoreData, defaults) {
  if (!defaults || !defaults.length) return firestoreData || []
  if (!firestoreData || !firestoreData.length) return defaults
  const fsIds = new Set(firestoreData.map(d => d.id))
  return [...defaults.filter(d => !fsIds.has(d.id)), ...firestoreData]
}

function ensure(name, orderField) {
  if (state[name]) return state[name]

  const colRef = collection(db, name)
  let qRef
  try { qRef = query(colRef, orderBy(orderField || 'createdAt', 'desc')) }
  catch { qRef = colRef }

  const s = { data: [], loading: true, listeners: new Set(), unsub: null }

  const publish = (docs) => {
    s.data = docs
    s.loading = false
    for (const fn of s.listeners) { try { fn() } catch {} }
  }

  // One-shot initial load
  getDocs(qRef).then(snap => {
    if (s.loading) publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }).catch(() => {
    getDocs(colRef).then(snap => {
      if (s.loading) publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {
      if (s.loading) publish([])
    })
  })

  // Live listener
  s.unsub = onSnapshot(qRef, (snap) => {
    publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, () => {
    try {
      s.unsub?.()
      s.unsub = onSnapshot(colRef, (snap) => {
        publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }, () => { if (s.loading) publish([]) })
    } catch { if (s.loading) publish([]) }
  })

  state[name] = s
  return s
}

/**
 * useRealtimeCollection(name, orderField, fallback)
 * Returns { data, loading }
 * - `data` always includes fallback defaults (merges with Firestore)
 * - `loading` only true while initial fetch pending
 */
export function useRealtimeCollection(name, orderField = 'createdAt', fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  useEffect(() => {
    const sub = ensure(name, orderField)

    const update = () => {
      const merged = mergeWithDefaults(sub.data, fallbackRef.current)
      setData(merged.length ? merged : fallbackRef.current)
      setLoading(sub.loading)
    }

    // If already loaded, update immediately
    if (!sub.loading) update()

    sub.listeners.add(update)
    return () => { sub.listeners.delete(update) }
  }, [name])

  return { data, loading }
}

export function invalidateRealtimeCache(name) {
  if (state[name]) {
    state[name].unsub?.()
    delete state[name]
  }
}
