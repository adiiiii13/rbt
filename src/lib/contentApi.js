import { getCollection } from './firebaseHelpers'

const CACHE_TTL_MS = 60_000
const memCache = new Map()

async function fetchCached(name, fallback, orderField = 'createdAt') {
  const hit = memCache.get(name)
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.data
  try {
    const data = await getCollection(name, orderField)
    if (data && data.length) {
      memCache.set(name, { data, t: Date.now() })
      try { localStorage.setItem(`rbt_cache_${name}`, JSON.stringify(data)) } catch {}
      return data
    }
  } catch (err) {
    console.warn(`[contentApi] ${name} fetch failed:`, err.message)
  }
  try {
    const cached = localStorage.getItem(`rbt_cache_${name}`)
    if (cached) return JSON.parse(cached)
  } catch {}
  return fallback || []
}

export const fetchCourses       = (fallback) => fetchCached('courses', fallback)
export const fetchVideos        = (fallback) => fetchCached('videos', fallback)
export const fetchAchievements  = (fallback) => fetchCached('achievements', fallback)
export const fetchTestimonials  = (fallback) => fetchCached('testimonials', fallback)
export const fetchNotices       = (fallback) => fetchCached('notices', fallback)
export const fetchPdfs          = (fallback) => fetchCached('pdfs', fallback)
export const fetchGallery       = (fallback) => fetchCached('gallery', fallback)

export function invalidateCache(name) {
  if (name) memCache.delete(name)
  else memCache.clear()
}

// Re-export realtime hook from useRealtime
export { useRealtimeCollection, invalidateRealtimeCache } from './useRealtime'
