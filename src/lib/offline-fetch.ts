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
// Offline-aware fetch wrapper
// This is the KEY piece: wraps all API calls to work offline
// ============================================================

/**
 * Determine a descriptive action name from the URL and HTTP method.
 */
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
  return 'MUTATION'
}

/**
 * Cache a successful GET response to IndexedDB.
 */
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

/**
 * Get cached data for a given URL from IndexedDB.
 */
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

/**
 * Offline-aware fetch: wraps standard fetch to work offline.
 *
 * - When online: makes the real request, caches GET responses, falls back to cache on error.
 * - When offline: returns cached data for GETs, queues mutations for later sync.
 */
export async function offlineFetch(url: string, options?: RequestInit): Promise<any> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const method = (options?.method || 'GET').toUpperCase()

  // ---- ONLINE PATH ----
  if (isOnline) {
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        const data = await response.json()
        // Cache GET responses for future offline use
        if (method === 'GET') {
          await cacheResponse(url, data)
        }
        return data
      }
      throw new Error(`HTTP ${response.status}`)
    } catch {
      // Fetch failed even though we thought we were online - fall back to cache
      const cached = await getCachedResponse(url)
      if (cached !== null) return cached
      throw new Error('Sin conexión y sin datos en caché')
    }
  }

  // ---- OFFLINE PATH ----
  if (method === 'GET') {
    // Return cached data for reads
    const cached = await getCachedResponse(url)
    if (cached !== null) return cached
    return null
  }

  // For mutations: queue for sync and return optimistic response
  const action = getActionFromUrl(url, method)
  const body = typeof options?.body === 'string' ? options.body : '{}'
  await addToSyncQueue(action, url, method, body)

  return {
    offline: true,
    queued: true,
    message: 'Cambio guardado localmente. Se sincronizará cuando haya conexión.',
  }
}
