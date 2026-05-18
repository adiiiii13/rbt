import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from './firebase'

const subscriptions = {}
const listeners = {}

function mergeWithDefaults(firestoreData, defaults) {
  if (!defaults || !defaults.length) return firestoreData || []
  if (!firestoreData || !firestoreData.length) return defaults
  const fsIds = new Set(firestoreData.map(d => d.id))
  const merged = [...firestoreData]
  for (const d of defaults) {
    if (!fsIds.has(d.id)) merged.push(d)
  }
  return merged
}

function broadcast(name) {
  const cbs = listeners[name]
  if (cbs) cbs.forEach(cb => cb())
}

function subscribeToCollection(name, orderField) {
  if (subscriptions[name]) return subscriptions[name]

  const colRef = collection(db, name)
  let qRef
  try { qRef = query(colRef, orderBy(orderField || 'createdAt', 'desc')) }
  catch { qRef = colRef }

  const state = { data: [], unsub: null, loading: true, error: false }

  const onDone = (docs) => {
    state.data = docs
    state.loading = false
    broadcast(name)
  }

  const onError = () => {
    state.loading = false
    state.error = true
    broadcast(name)
  }

  // Fast initial load
  getDocs(qRef).then(snap => onDone(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    .catch(() => {
      getDocs(colRef).then(snap => onDone(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        .catch(onError)
    })

  // Live listener (graceful if permission denied)
  state.unsub = onSnapshot(qRef, (snap) => {
    onDone(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, () => {
    state.unsub?.()
    try {
      state.unsub = onSnapshot(colRef, (snap) => {
        onDone(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }, onError)
    } catch {
      onError()
    }
  })

  subscriptions[name] = state
  return state
}

/**
 * useRealtimeCollection hook
 * - Shows fallback defaults immediately on mount
 * - Merges with Firestore data as it arrives
 * - Falls back to defaults if Firestore fails
 */
export function useRealtimeCollection(collectionName, orderField = 'createdAt', fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const fallbackRef = useRef(fallback)

  useEffect(() => {
    fallbackRef.current = fallback
    let cancelled = false

    const callback = () => {
      if (cancelled) return
      const state = subscriptions[collectionName]
      if (state) {
        const merged = mergeWithDefaults(state.data, fallbackRef.current)
        setData(merged)
        setLoading(state.loading)
      }
    }

    if (!listeners[collectionName]) listeners[collectionName] = []
    listeners[collectionName].push(callback)

    // If already subscribed and loaded, use existing data immediately
    const existing = subscriptions[collectionName]
    if (existing && !existing.loading) {
      setData(mergeWithDefaults(existing.data, fallback))
      setLoading(false)
    } else if (!existing) {
      // Subscribe — loading will be true, fallback stays until Firestore responds
      subscribeToCollection(collectionName, orderField)
    }

    return () => {
      cancelled = true
      const cbs = listeners[collectionName]
      if (cbs) { const idx = cbs.indexOf(callback); if (idx >= 0) cbs.splice(idx, 1) }
    }
  }, [collectionName])

  return { data, loading }
}

export function invalidateRealtimeCache(name) {
  if (name && subscriptions[name]) {
    subscriptions[name].unsub?.()
    delete subscriptions[name]
  }
}
