'use client'

import {
  addToSyncQueue,
  getCachedProducts,
  getCachedCustomers,
  getCachedSales,
  getCachedRepairOrders,
  getCachedCategories,
  getCachedSuppliers,
  getCachedExpenses,
  getCachedDashboardData,
  cacheProducts,
  cacheCustomers,
  cacheSales,
  cacheRepairOrders,
  cacheCategories,
  cacheSuppliers,
  cacheExpenses,
  cacheDashboardData,
} from './offline-db'

// ============================================================
// OfflineResponse - mimics the Response interface from fetch()
// This allows offlineFetch() to be a drop-in replacement for fetch()
// ============================================================

export class OfflineResponse {
  ok: boolean
  status: number
  statusText: string
  headers: Headers
  private _data: any
  private _jsonParsed: boolean = false
  /** True if this response was generated from offline cache (not a real server response) */
  offline: boolean
  /** True if the mutation was queued for sync (offline write) */
  queued: boolean

  constructor(data: any, options: {
    status?: number
    statusText?: string
    offline?: boolean
    queued?: boolean
  } = {}) {
    this._data = data
    this.status = options.status ?? 200
    this.statusText = options.statusText ?? ''
    this.ok = this.status >= 200 && this.status < 300
    this.offline = options.offline ?? false
    this.queued = options.queued ?? false
    this.headers = new Headers()
  }

  async json(): Promise<any> {
    return this._data
  }

  async text(): Promise<string> {
    return typeof this._data === 'string' ? this._data : JSON.stringify(this._data)
  }

  async blob(): Promise<Blob> {
    const text = typeof this._data === 'string' ? this._data : JSON.stringify(this._data)
    return new Blob([text], { type: 'application/json' })
  }

  clone(): OfflineResponse {
    return new OfflineResponse(this._data, {
      status: this.status,
      statusText: this.statusText,
      offline: this.offline,
      queued: this.queued,
    })
  }
}

// ============================================================
// Action mapping for sync queue
// ============================================================

function getActionFromUrl(url: string, method: string): string {
  if (url.includes('/api/sales') && method === 'POST') return 'CREATE_SALE'
  if (url.includes('/api/sales') && method === 'PUT') return 'UPDATE_SALE'
  if (url.includes('/api/sales') && method === 'DELETE') return 'DELETE_SALE'
  if (url.includes('/api/repairs') && url.includes('/parts') && method === 'POST') return 'ADD_REPAIR_PART'
  if (url.includes('/api/repairs') && method === 'POST') return 'CREATE_REPAIR'
  if (url.includes('/api/repairs') && method === 'PUT') return 'UPDATE_REPAIR'
  if (url.includes('/api/customers') && method === 'POST') return 'CREATE_CUSTOMER'
  if (url.includes('/api/customers') && method === 'PUT') return 'UPDATE_CUSTOMER'
  if (url.includes('/api/products') && method === 'POST') return 'CREATE_PRODUCT'
  if (url.includes('/api/products') && method === 'PUT') return 'UPDATE_PRODUCT'
  if (url.includes('/api/categories') && method === 'POST') return 'CREATE_CATEGORY'
  if (url.includes('/api/categories') && method === 'PUT') return 'UPDATE_CATEGORY'
  if (url.includes('/api/suppliers') && method === 'POST') return 'CREATE_SUPPLIER'
  if (url.includes('/api/suppliers') && method === 'PUT') return 'UPDATE_SUPPLIER'
  if (url.includes('/api/expenses') && method === 'POST') return 'CREATE_EXPENSE'
  if (url.includes('/api/expenses') && method === 'PUT') return 'UPDATE_EXPENSE'
  if (url.includes('/api/stock') && method === 'POST') return 'STOCK_MOVEMENT'
  if (url.includes('/api/workshops') && method === 'POST') return 'CREATE_WORKSHOP'
  if (url.includes('/api/workshops') && method === 'PUT') return 'UPDATE_WORKSHOP'
  return 'MUTATION'
}

// ============================================================
// Cache a successful GET response to IndexedDB
// ============================================================

async function cacheResponse(url: string, data: any): Promise<void> {
  try {
    const items = data?.data || data

    if (url.includes('/api/dashboard')) {
      await cacheDashboardData({
        id: 'main',
        data: JSON.stringify(data),
        cachedAt: new Date().toISOString(),
      })
    } else if (url.includes('/api/products') && Array.isArray(items)) {
      await cacheProducts(items)
    } else if (url.includes('/api/customers') && Array.isArray(items)) {
      await cacheCustomers(items)
    } else if (url.includes('/api/categories') && Array.isArray(items)) {
      await cacheCategories(items)
    } else if (url.includes('/api/suppliers') && Array.isArray(items)) {
      await cacheSuppliers(items)
    } else if (url.includes('/api/sales') && Array.isArray(items)) {
      await cacheSales(items)
    } else if (url.includes('/api/repairs') && Array.isArray(items)) {
      await cacheRepairOrders(items)
    } else if (url.includes('/api/expenses') && Array.isArray(items)) {
      await cacheExpenses(items)
    }
  } catch {
    // Caching failure is non-critical
  }
}

// ============================================================
// Get cached data for a given URL from IndexedDB
// ============================================================

async function getCachedResponse(url: string): Promise<any> {
  try {
    if (url.includes('/api/dashboard')) {
      const cached = await getCachedDashboardData()
      if (cached) {
        return JSON.parse(cached.data)
      }
      return {
        salesToday: { total: 0, count: 0 },
        salesMonth: { total: 0, count: 0 },
        repairsByStatus: {},
        lowStockProducts: [],
        recentActivity: [],
        expensesSummary: { today: 0, month: 0 },
        revenueChart: [],
        topProducts: [],
      }
    }

    if (url.includes('/api/products')) {
      const data = await getCachedProducts()
      return { data, total: data.length }
    }
    if (url.includes('/api/customers')) {
      const data = await getCachedCustomers()
      return { data, total: data.length }
    }
    if (url.includes('/api/categories')) {
      return await getCachedCategories()
    }
    if (url.includes('/api/suppliers')) {
      return await getCachedSuppliers()
    }
    if (url.includes('/api/sales')) {
      const data = await getCachedSales()
      return { data, total: data.length }
    }
    if (url.includes('/api/repairs')) {
      const data = await getCachedRepairOrders()
      return { data, total: data.length }
    }
    if (url.includes('/api/expenses')) {
      const data = await getCachedExpenses()
      return { data, total: data.length }
    }

    return null
  } catch {
    return null
  }
}

// ============================================================
// offlineFetch - Drop-in replacement for fetch() that works offline
//
// Returns an OfflineResponse (compatible with the Response interface):
//   - .ok: boolean (true if status 200-299)
//   - .status: number
//   - .json(): Promise<any> (returns parsed data)
//   - .offline: boolean (true if data came from cache)
//   - .queued: boolean (true if mutation was queued for sync)
//
// Behavior:
//   Online GET:  real fetch → cache response → return Response
//   Online mutation: real fetch → return Response (with fallback to cache on network error)
//   Offline GET: return cached data from IndexedDB as OfflineResponse
//   Offline mutation: queue in syncQueue → return optimistic OfflineResponse
// ============================================================

export async function offlineFetch(url: string, options?: RequestInit): Promise<OfflineResponse | Response> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const method = (options?.method || 'GET').toUpperCase()

  // ---- ONLINE PATH ----
  if (isOnline) {
    try {
      const response = await fetch(url, options)

      // For successful GET responses, cache the data in background
      if (response.ok && method === 'GET') {
        try {
          const cloned = response.clone()
          const data = await cloned.json()
          // Don't await - cache in background to avoid blocking
          cacheResponse(url, data)
        } catch {
          // Caching failure is non-critical
        }
      }

      return response
    } catch (error) {
      // Network error even though navigator.onLine was true (flaky connection)
      if (method === 'GET') {
        // For GETs, try to fall back to cache
        const cached = await getCachedResponse(url)
        if (cached !== null) {
          return new OfflineResponse(cached, {
            status: 200,
            statusText: 'OK (from cache)',
            offline: true,
          })
        }
        // No cache available - return a proper error response
        return new OfflineResponse(
          { error: 'Sin conexión y sin datos en caché' },
          { status: 503, statusText: 'Service Unavailable', offline: true }
        )
      }

      // For mutations when offline, queue them
      const action = getActionFromUrl(url, method)
      const body = typeof options?.body === 'string' ? options.body : '{}'
      await addToSyncQueue(action, url, method, body)

      return new OfflineResponse(
        {
          offline: true,
          queued: true,
          message: 'Sin conexión. Cambio guardado localmente, se sincronizará cuando haya conexión.',
        },
        { status: 202, statusText: 'Accepted (queued for sync)', offline: true, queued: true }
      )
    }
  }

  // ---- OFFLINE PATH ----
  if (method === 'GET') {
    // Return cached data for reads
    const cached = await getCachedResponse(url)
    if (cached !== null) {
      return new OfflineResponse(cached, {
        status: 200,
        statusText: 'OK (offline cache)',
        offline: true,
      })
    }
    // No cache available
    return new OfflineResponse(
      { error: 'Sin datos disponibles sin conexión' },
      { status: 503, statusText: 'Service Unavailable', offline: true }
    )
  }

  // For mutations: queue for sync and return optimistic response
  const action = getActionFromUrl(url, method)
  const body = typeof options?.body === 'string' ? options.body : '{}'
  await addToSyncQueue(action, url, method, body)

  return new OfflineResponse(
    {
      offline: true,
      queued: true,
      message: 'Sin conexión. Cambio guardado localmente, se sincronizará cuando haya conexión.',
    },
    { status: 202, statusText: 'Accepted (queued for sync)', offline: true, queued: true }
  )
}
