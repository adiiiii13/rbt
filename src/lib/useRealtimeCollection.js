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

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setData(rows)
        setLoading(false)
        try { localStorage.setItem(`rbt_cache_${name}`, JSON.stringify(rows)) } catch {}
      },
      (err) => {
        console.warn(`[useRealtimeCollection] ${name}`, err.message)
        // Retry without orderBy if index missing
        if (err.code === 'failed-precondition') {
          const fallbackQ = query(collection(db, name))
          const unsub2 = onSnapshot(fallbackQ, (snap) => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setData(rows)
            setLoading(false)
          })
          return unsub2
        }
        setError(err)
        setLoading(false)
      }
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, orderField, orderDir, enabled, JSON.stringify(whereClauses)])

  return { data, loading, error }
}
