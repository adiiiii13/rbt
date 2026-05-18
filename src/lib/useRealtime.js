import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from './firebase'

const subscriptions = {}

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
      // Fallback: unordered query
      getDocs(colRef).then(snap => onDone(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        .catch(onError)
    })

  // Live listener (graceful if permission denied)
  state.unsub = onSnapshot(qRef, (snap) => {
    onDone(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, () => {
    // Ordered query failed — try unordered
    state.unsub?.()
    state.unsub = onSnapshot(colRef, (snap) => {
      onDone(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, onError)
  })

  subscriptions[name] = state
  return state
}

const listeners = {}

function broadcast(name) {
  const cbs = listeners[name]
  if (cbs) cbs.forEach(cb => cb())
}

function mergeWithDefaults(firestoreData, defaults) {
  if (!defaults || !defaults.length) return firestoreData
  if (!firestoreData || !firestoreData.length) return defaults
  const fsIds = new Set(firestoreData.map(d => d.id))
  const merged = [...firestoreData]
  for (const d of defaults) {
    if (!fsIds.has(d.id)) merged.push(d)
  }
  return merged
}

export function useRealtimeCollection(collectionName, orderField = 'createdAt', fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!listeners[collectionName]) listeners[collectionName] = []
    const callback = () => {
      if (cancelled) return
      const state = subscriptions[collectionName]
      if (state) {
        setData(mergeWithDefaults(state.data, fallback))
        setLoading(state.loading)
      }
    }
    listeners[collectionName].push(callback)

    subscribeToCollection(collectionName, orderField)

    const state = subscriptions[collectionName]
    if (!state.loading) {
      setData(mergeWithDefaults(state.data, fallback))
      setLoading(false)
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
