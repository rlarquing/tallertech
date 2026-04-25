'use client'

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// ============================================================
// Type Definitions
// ============================================================

interface SaleItemOffline {
  id: string
  productId: string | null
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  type: string
}

interface RepairPartOffline {
  id: string
  productId: string | null
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface TallerTechDB extends DBSchema {
  products: {
    key: string
    value: {
      id: string
      name: string
      sku: string | null
      description: string | null
      categoryId: string | null
      supplierId: string | null
      costPrice: number
      salePrice: number
      quantity: number
      minStock: number
      unit: string
      type: string
      brand: string | null
      model: string | null
      location: string | null
      active: boolean
      createdAt: string
      updatedAt: string
    }
    indexes: { 'by-type': string; 'by-category': string }
  }
  customers: {
    key: string
    value: {
      id: string
      name: string
      phone: string | null
      email: string | null
      address: string | null
      dni: string | null
      notes: string | null
      active: boolean
      createdAt: string
      updatedAt: string
    }
    indexes: { 'by-name': string }
  }
  sales: {
    key: string
    value: {
      id: string
      code: string
      customerId: string | null
      userId: string
      userName: string
      subtotal: number
      discount: number
      tax: number
      total: number
      paymentMethod: string
      status: string
      notes: string | null
      createdAt: string
      updatedAt: string
      items: SaleItemOffline[]
    }
    indexes: { 'by-status': string; 'by-date': string }
  }
  repairOrders: {
    key: string
    value: {
      id: string
      code: string
      customerId: string
      userId: string
      userName: string
      device: string
      brand: string | null
      imei: string | null
      issue: string
      diagnosis: string | null
      solution: string | null
      status: string
      priority: string
      costEstimate: number
      laborCost: number
      partsCost: number
      totalCost: number
      paymentMethod: string
      paid: boolean
      receivedAt: string
      estimatedReady: string | null
      completedAt: string | null
      deliveredAt: string | null
      notes: string | null
      createdAt: string
      updatedAt: string
      parts: RepairPartOffline[]
    }
    indexes: { 'by-status': string }
  }
  categories: {
    key: string
    value: {
      id: string
      name: string
      description: string | null
      type: string
      active: boolean
    }
    indexes: { 'by-type': string }
  }
  suppliers: {
    key: string
    value: {
      id: string
      name: string
      phone: string | null
      email: string | null
      address: string | null
      notes: string | null
      active: boolean
    }
  }
  expenses: {
    key: string
    value: {
      id: string
      category: string
      description: string
      amount: number
      userId: string
      userName: string
      date: string
      notes: string | null
      createdAt: string
      updatedAt: string
    }
    indexes: { 'by-category': string }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      action: string
      endpoint: string
      method: string
      body: string
      createdAt: string
      retries: number
      lastError: string | null
    }
    indexes: { 'by-created': string }
  }
  dashboardCache: {
    key: string
    value: { id: string; data: string; cachedAt: string }
  }
}

// ============================================================
// Database Singleton
// ============================================================

const DB_NAME = 'tallertech-offline'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<TallerTechDB> | null = null

export async function getDB(): Promise<IDBPDatabase<TallerTechDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<TallerTechDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' })
        productStore.createIndex('by-type', 'type')
        productStore.createIndex('by-category', 'categoryId')
      }

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' })
        customerStore.createIndex('by-name', 'name')
      }

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', { keyPath: 'id' })
        salesStore.createIndex('by-status', 'status')
        salesStore.createIndex('by-date', 'createdAt')
      }

      // Repair orders store
      if (!db.objectStoreNames.contains('repairOrders')) {
        const repairStore = db.createObjectStore('repairOrders', { keyPath: 'id' })
        repairStore.createIndex('by-status', 'status')
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
        categoryStore.createIndex('by-type', 'type')
      }

      // Suppliers store
      if (!db.objectStoreNames.contains('suppliers')) {
        db.createObjectStore('suppliers', { keyPath: 'id' })
      }

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' })
        expenseStore.createIndex('by-category', 'category')
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
        syncStore.createIndex('by-created', 'createdAt')
      }

      // Dashboard cache store
      if (!db.objectStoreNames.contains('dashboardCache')) {
        db.createObjectStore('dashboardCache', { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}

// ============================================================
// Products
// ============================================================

export async function cacheProducts(products: TallerTechDB['products']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('products', 'readwrite')
  const store = tx.objectStore('products')

  // Clear existing and put all new
  await store.clear()
  for (const product of products) {
    await store.put(product)
  }

  await tx.done
}

export async function getCachedProducts(): Promise<TallerTechDB['products']['value'][]> {
  const db = await getDB()
  return db.getAll('products')
}

// ============================================================
// Customers
// ============================================================

export async function cacheCustomers(customers: TallerTechDB['customers']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('customers', 'readwrite')
  const store = tx.objectStore('customers')

  await store.clear()
  for (const customer of customers) {
    await store.put(customer)
  }

  await tx.done
}

export async function getCachedCustomers(): Promise<TallerTechDB['customers']['value'][]> {
  const db = await getDB()
  return db.getAll('customers')
}

// ============================================================
// Sales
// ============================================================

export async function cacheSales(sales: TallerTechDB['sales']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('sales', 'readwrite')
  const store = tx.objectStore('sales')

  await store.clear()
  for (const sale of sales) {
    await store.put(sale)
  }

  await tx.done
}

export async function getCachedSales(): Promise<TallerTechDB['sales']['value'][]> {
  const db = await getDB()
  return db.getAll('sales')
}

// ============================================================
// Repair Orders
// ============================================================

export async function cacheRepairOrders(repairs: TallerTechDB['repairOrders']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('repairOrders', 'readwrite')
  const store = tx.objectStore('repairOrders')

  await store.clear()
  for (const repair of repairs) {
    await store.put(repair)
  }

  await tx.done
}

export async function getCachedRepairOrders(): Promise<TallerTechDB['repairOrders']['value'][]> {
  const db = await getDB()
  return db.getAll('repairOrders')
}

// ============================================================
// Categories
// ============================================================

export async function cacheCategories(categories: TallerTechDB['categories']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('categories', 'readwrite')
  const store = tx.objectStore('categories')

  await store.clear()
  for (const category of categories) {
    await store.put(category)
  }

  await tx.done
}

export async function getCachedCategories(): Promise<TallerTechDB['categories']['value'][]> {
  const db = await getDB()
  return db.getAll('categories')
}

// ============================================================
// Suppliers
// ============================================================

export async function cacheSuppliers(suppliers: TallerTechDB['suppliers']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('suppliers', 'readwrite')
  const store = tx.objectStore('suppliers')

  await store.clear()
  for (const supplier of suppliers) {
    await store.put(supplier)
  }

  await tx.done
}

export async function getCachedSuppliers(): Promise<TallerTechDB['suppliers']['value'][]> {
  const db = await getDB()
  return db.getAll('suppliers')
}

// ============================================================
// Expenses
// ============================================================

export async function cacheExpenses(expenses: TallerTechDB['expenses']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('expenses', 'readwrite')
  const store = tx.objectStore('expenses')

  await store.clear()
  for (const expense of expenses) {
    await store.put(expense)
  }

  await tx.done
}

export async function getCachedExpenses(): Promise<TallerTechDB['expenses']['value'][]> {
  const db = await getDB()
  return db.getAll('expenses')
}

// ============================================================
// Dashboard Cache
// ============================================================

export async function cacheDashboardData(data: TallerTechDB['dashboardCache']['value']): Promise<void> {
  const db = await getDB()
  await db.put('dashboardCache', data)
}

export async function getCachedDashboardData(): Promise<TallerTechDB['dashboardCache']['value'] | null> {
  const db = await getDB()
  return db.get('dashboardCache', 'main')
}

// ============================================================
// Sync Queue
// ============================================================

export async function addToSyncQueue(
  action: string,
  endpoint: string,
  method: string,
  body: string
): Promise<string> {
  const db = await getDB()
  const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const item: TallerTechDB['syncQueue']['value'] = {
    id,
    action,
    endpoint,
    method,
    body,
    createdAt: new Date().toISOString(),
    retries: 0,
    lastError: null,
  }
  await db.put('syncQueue', item)
  return id
}

export async function getSyncQueue(): Promise<TallerTechDB['syncQueue']['value'][]> {
  const db = await getDB()
  return db.getAll('syncQueue')
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('syncQueue', id)
}

export async function updateSyncQueueError(id: string, error: string): Promise<void> {
  const db = await getDB()
  const item = await db.get('syncQueue', id)
  if (item) {
    item.retries += 1
    item.lastError = error
    await db.put('syncQueue', item)
  }
}

// ============================================================
// Clear All Data
// ============================================================

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const storeNames = [
    'products',
    'customers',
    'sales',
    'repairOrders',
    'categories',
    'suppliers',
    'expenses',
    'syncQueue',
    'dashboardCache',
  ] as const

  for (const storeName of storeNames) {
    await db.clear(storeName)
  }
}
