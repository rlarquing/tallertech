'use client'

import {
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueError,
  cacheProducts,
  cacheCustomers,
  cacheCategories,
  cacheSuppliers,
  cacheSales,
  cacheRepairOrders,
  cacheExpenses,
  cacheDashboardData,
} from './offline-db'

// ============================================================
// Sync Manager - Handles syncing offline mutations when back online
// ============================================================

export class SyncManagerService {
  private static instance: SyncManagerService
  private syncing = false

  private constructor() {}

  static getInstance(): SyncManagerService {
    if (!SyncManagerService.instance) {
      SyncManagerService.instance = new SyncManagerService()
    }
    return SyncManagerService.instance
  }

  get isSyncing(): boolean {
    return this.syncing
  }

  async syncAll(): Promise<{ processed: number; failed: number }> {
    if (this.syncing || typeof window === 'undefined' || !navigator.onLine) {
      return { processed: 0, failed: 0 }
    }

    this.syncing = true
    let processed = 0
    let failed = 0

    try {
      const queue = await getSyncQueue()

      for (const item of queue) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.body,
          })

          if (response.ok) {
            await removeFromSyncQueue(item.id)
            processed++

            // Try to update local data with server response
            try {
              const result = await response.json()
              await this.updateLocalData(item.action, result)
            } catch {
              // Non-critical: response body parse failed
            }
          } else {
            await updateSyncQueueError(item.id, `HTTP ${response.status}`)
            failed++

            // If auth error, stop syncing
            if (response.status === 401) break
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          await updateSyncQueueError(item.id, errorMessage)
          failed++
        }
      }

      // After syncing queue, refresh all cached data from server
      if (processed > 0) {
        await this.refreshAllData()
      }
    } finally {
      this.syncing = false
    }

    return { processed, failed }
  }

  private async updateLocalData(action: string, result: Record<string, unknown>): Promise<void> {
    // Update IndexedDB with server response (e.g., replace temp ID with real ID)
    // This ensures local data matches what the server has after a successful sync
    try {
      if (action.startsWith('CREATE_')) {
        // After creating, refresh the relevant data from server
        await this.refreshAllData()
      }
    } catch {
      // Non-critical: local data update failed
    }
  }

  async refreshAllData(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) return

    const endpoints: Array<{
      cache: (data: unknown[]) => Promise<void>
      url: string
    }> = [
      { cache: (d) => cacheProducts(d as Parameters<typeof cacheProducts>[0]), url: '/api/products?limit=1000' },
      { cache: (d) => cacheCustomers(d as Parameters<typeof cacheCustomers>[0]), url: '/api/customers?limit=1000' },
      { cache: (d) => cacheCategories(d as Parameters<typeof cacheCategories>[0]), url: '/api/categories' },
      { cache: (d) => cacheSuppliers(d as Parameters<typeof cacheSuppliers>[0]), url: '/api/suppliers' },
      { cache: (d) => cacheSales(d as Parameters<typeof cacheSales>[0]), url: '/api/sales?limit=100' },
      { cache: (d) => cacheRepairOrders(d as Parameters<typeof cacheRepairOrders>[0]), url: '/api/repairs?limit=100' },
      { cache: (d) => cacheExpenses(d as Parameters<typeof cacheExpenses>[0]), url: '/api/expenses?limit=100' },
    ]

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url)
        if (res.ok) {
          const data = await res.json()
          await ep.cache(data.data || data)
        }
      } catch {
        // Skip if offline or fetch fails
      }
    }

    // Cache dashboard data separately
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        await cacheDashboardData({
          id: 'main',
          data: JSON.stringify(data),
          cachedAt: new Date().toISOString(),
        })
      }
    } catch {
      // Skip if offline
    }
  }
}
