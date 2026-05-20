import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const state = {}
const deletedSets = {} // { [name]: Set<string> }
const deletedLoaded = {} // { [name]: boolean }

// Load deleted IDs from _deleted collection
async function loadDeletedIds(name) {
  if (deletedLoaded[name]) return deletedSets[name]
  try {
    const snap = await getDocs(collection(db, '_deleted'))
    const ids = new Set()
    for (const d of snap.docs) {
      if (d.data().collection === name) ids.add(d.data().originalId)
    }
    deletedSets[name] = ids
    deletedLoaded[name] = true
    return ids
  } catch {
    deletedSets[name] = new Set()
    deletedLoaded[name] = true
    return new Set()
  }
}

// Mark an ID as deleted in _deleted collection
export async function markAsDeleted(collectionName, id) {
  try {
    await setDoc(doc(db, '_deleted', `${collectionName}__${id}`), {
      collection: collectionName,
      originalId: id,
      deletedAt: new Date().toISOString()
    })
    if (!deletedSets[collectionName]) deletedSets[collectionName] = new Set()
    deletedSets[collectionName].add(id)
    broadcast(collectionName)
  } catch (err) {
    console.warn('[markAsDeleted]', err.message)
  }
}

function mergeWithDefaults(firestoreData, defaults, collectionName) {
  const deleted = deletedSets[collectionName] || new Set()
  const fsIds = new Set(firestoreData.map(d => d.id))
  const filteredDefaults = defaults.filter(d => !fsIds.has(d.id) && !deleted.has(d.id))
  return [...firestoreData, ...filteredDefaults]
}

function broadcast(name) {
  const s = state[name]
  if (s) {
    for (const fn of s.listeners) { try { fn() } catch {} }
  }
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
    broadcast(name)
  }

  getDocs(qRef).then(snap => {
    if (s.loading) publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }).catch(() => {
    getDocs(colRef).then(snap => {
      if (s.loading) publish(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {
      if (s.loading) publish([])
    })
  })

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

export function useRealtimeCollection(name, orderField = 'createdAt', fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  useEffect(() => {
    let cancelled = false

    // Load deleted IDs, then subscribe
    loadDeletedIds(name).then(() => {
      if (cancelled) return
      const sub = ensure(name, orderField)

      const update = () => {
        const merged = mergeWithDefaults(sub.data, fallbackRef.current, name)
        setData(merged.length ? merged : fallbackRef.current)
        setLoading(sub.loading)
      }

      if (!sub.loading) update()

      sub.listeners.add(update)
    })

    return () => { cancelled = true }
  }, [name])

  return { data, loading }
}

export function invalidateRealtimeCache(name) {
  if (state[name]) {
    state[name].unsub?.()
    delete state[name]
  }
  delete deletedSets[name]
  delete deletedLoaded[name]
}
