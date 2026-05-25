import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Live Firestore collection.
 * Emits updates instantly when admin writes — no manual refresh needed.
 *
 * @param {string} name - collection name
 * @param {object} opts
 * @param {string} [opts.orderField='createdAt']
 * @param {'asc'|'desc'} [opts.orderDir='desc']
 * @param {Array<[string,string,any]>} [opts.where] - [[field, op, value], ...]
 * @param {Array} [opts.fallback] - initial value while loading / on error
 * @param {boolean} [opts.enabled=true] - pause subscription
 */
export function useRealtimeCollection(name, opts = {}) {
  const {
    orderField = 'createdAt',
    orderDir = 'desc',
    where: whereClauses = [],
    fallback = [],
    enabled = true,
  } = opts

  const [data, setData] = useState(() => {
    // hydrate from localStorage cache for instant paint
    try {
      const cached = localStorage.getItem(`rbt_cache_${name}`)
      if (cached) return JSON.parse(cached)
    } catch {}
    return fallback
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) { setLoading(false); return }
    let q
    try {
      const constraints = []
      for (const [f, op, v] of whereClauses) constraints.push(where(f, op, v))
      constraints.push(orderBy(orderField, orderDir))
      q = query(collection(db, name), ...constraints)
    } catch (err) {
      setError(err)
      setLoading(false)
      return
    }

    // Safety net: if neither success nor error fires within 8s
    // (e.g. ad-blocker or offline), stop the spinner so UI is usable.
    const stuckTimer = setTimeout(() => {
      console.warn(`[useRealtimeCollection] ${name} timed out — stopping spinner`)
      setLoading(false)
    }, 8000)

    const unsub = onSnapshot(
      q,
      (snap) => {
        clearTimeout(stuckTimer)
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setData(rows)
        setLoading(false)
        try { localStorage.setItem(`rbt_cache_${name}`, JSON.stringify(rows)) } catch {}
      },
      (err) => {
        clearTimeout(stuckTimer)
        console.warn(`[useRealtimeCollection] ${name}`, err.message)
        // Retry without orderBy if index missing
        if (err.code === 'failed-precondition') {
          const fallbackConstraints = []
          for (const [f, op, v] of whereClauses) fallbackConstraints.push(where(f, op, v))
          const fallbackQ = query(collection(db, name), ...fallbackConstraints)
          const unsub2 = onSnapshot(fallbackQ, (snap) => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setData(rows)
            setLoading(false)
          }, (err2) => {
            console.error(`[useRealtimeCollection] fallback failed for ${name}:`, err2)
            setError(err2)
            setLoading(false)
          })
          return unsub2
        }
        setError(err)
        setLoading(false)
      }
    )
    return () => { clearTimeout(stuckTimer); unsub() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, orderField, orderDir, enabled, JSON.stringify(whereClauses)])

  return { data, loading, error }
}
