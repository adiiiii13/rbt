import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Realtime Firestore hook — admin writes → instant update on public pages
// subscriptions[name] = { subscribers: Set, data: [], unsub: fn }
const subscriptions = {}

function getCollectionName(name) {
  return name.replace(/^(courses|videos|achievements|testimonials|notices|pdfs|gallery)$/).toString()
}

function subscribeToCollection(name, orderField) {
  if (subscriptions[name]) {
    subscriptions[name].subscribers++
    return subscriptions[name]
  }

  const colRef = collection(db, name)
  let qRef
  try {
    qRef = query(colRef, orderBy(orderField || 'createdAt', 'desc'))
  } catch {
    qRef = colRef
  }

  const state = { data: [], unsub: null, loading: true, error: null }

  // Try getDocs first (faster initial load), then switch to onSnapshot
  getDocs(qRef).then(snapshot => {
    state.data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    state.loading = false
    broadcast(name)
  }).catch(() => {
    getDocs(colRef).then(snapshot => {
      state.data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      state.loading = false
      broadcast(name)
    })
  })

  state.unsub = onSnapshot(qRef, (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    state.data = docs
    state.loading = false
    broadcast(name)
  }, (err) => {
    // Fallback: unordered query
    state.unsub?.()
    state.unsub = onSnapshot(colRef, (snapshot) => {
      state.data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      state.loading = false
      broadcast(name)
    })
  })

  subscriptions[name] = state
  return state
}

// Broadcast to React via refs
const listeners = {}

function broadcast(name) {
  const callbacks = listeners[name]
  if (callbacks) {
    callbacks.forEach(cb => cb())
  }
}

/**
 * useRealtimeCollection hook
 * @param {string} collectionName - Firestore collection name
 * @param {string} orderField - field to orderBy (default 'createdAt')
 * @param {Array} fallback - fallback data
 * @returns {Object} { data, loading, error }
 */
export function useRealtimeCollection(collectionName, orderField = 'createdAt', fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!listeners[collectionName]) listeners[collectionName] = []
    const callback = () => {
      if (cancelled) return
      const state = subscriptions[collectionName]
      if (state) {
        setData(state.data.length ? state.data : fallback)
        setLoading(state.loading)
      }
    }
    listeners[collectionName].push(callback)

    subscribeToCollection(collectionName, orderField)

    // If already loaded (getDocs finished), set immediately
    const state = subscriptions[collectionName]
    if (!state.loading) {
      setData(state.data.length ? state.data : fallback)
      setLoading(false)
    }

    return () => {
      cancelled = true
      const cbs = listeners[collectionName]
      if (cbs) {
        const idx = cbs.indexOf(callback)
        if (idx >= 0) cbs.splice(idx, 1)
      }
    }
  }, [collectionName])

  return { data, loading, error }
}

export function invalidateRealtimeCache(name) {
  if (name && subscriptions[name]) {
    subscriptions[name].unsub?.()
    delete subscriptions[name]
  }
}
