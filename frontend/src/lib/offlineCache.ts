/**
 * IndexedDB cache for chart calculation results.
 * Stores last 100 charts so the app works read-only offline.
 * Calculations always go to the backend — never recalculated locally.
 */

const DB_NAME = 'jyotish_offline'
const DB_VERSION = 1
const STORE_CHARTS = 'charts'
const MAX_CACHED = 100

let _db: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_CHARTS)) {
        const store = db.createObjectStore(STORE_CHARTS, { keyPath: 'cacheKey' })
        store.createIndex('cachedAt', 'cachedAt')
      }
    }
    req.onsuccess = e => {
      _db = (e.target as IDBOpenDBRequest).result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

export interface CachedChart {
  cacheKey: string       // hash of birth params
  chartData: any         // full API response
  birthParams: any       // original request params
  cachedAt: number       // timestamp
  name?: string
}

function makeCacheKey(params: any): string {
  const { year, month, day, hour, minute, lat, lon, tz, ayanamsa } = params
  return `${year}-${month}-${day}-${hour}-${minute}-${lat}-${lon}-${tz}-${ayanamsa || 'lahiri'}`
}

export async function cacheChart(params: any, data: any, name?: string): Promise<void> {
  try {
    const db = await getDB()
    const cacheKey = makeCacheKey(params)
    const tx = db.transaction(STORE_CHARTS, 'readwrite')
    const store = tx.objectStore(STORE_CHARTS)
    store.put({ cacheKey, chartData: data, birthParams: params, cachedAt: Date.now(), name })

    // Evict oldest if over MAX_CACHED
    const countReq = store.count()
    countReq.onsuccess = () => {
      if (countReq.result > MAX_CACHED) {
        const idx = store.index('cachedAt')
        idx.openCursor().onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result
          if (cursor) { cursor.delete(); }
        }
      }
    }
  } catch (_) { /* never block UI for cache errors */ }
}

export async function getCachedChart(params: any): Promise<CachedChart | null> {
  try {
    const db = await getDB()
    const cacheKey = makeCacheKey(params)
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CHARTS, 'readonly')
      const req = tx.objectStore(STORE_CHARTS).get(cacheKey)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch (_) { return null }
}

export async function listCachedCharts(): Promise<CachedChart[]> {
  try {
    const db = await getDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CHARTS, 'readonly')
      const req = tx.objectStore(STORE_CHARTS).index('cachedAt').getAll()
      req.onsuccess = () => resolve((req.result as CachedChart[]).reverse())
      req.onerror = () => resolve([])
    })
  } catch (_) { return [] }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_CHARTS, 'readwrite')
    tx.objectStore(STORE_CHARTS).clear()
  } catch (_) {}
}
