// ============================================================
// Domain Entities - Core business types
// Clean Architecture: Enterprise Business Rules Layer
// ============================================================

// ─── Auth ────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'employee'
  active: boolean
  image?: string | null
  provider?: string // 'credentials' | 'google'
  createdAt: Date
  updatedAt: Date
}

export interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  image?: string | null
  provider?: string
}

// ─── Inventory ───────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  description: string | null
  type: 'product' | 'service' | 'part'
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
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
  type: 'product' | 'service' | 'part'
  brand: string | null
  model: string | null
  location: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Sales ───────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  dni: string | null
  notes: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Sale {
  id: string
  code: string
  customerId: string | null
  userId: string
  userName: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: 'efectivo' | 'transferencia' | 'mixto'
  status: 'completed' | 'cancelled' | 'pending'
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: SaleItem[]
  customer?: { name: string } | null
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string | null
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  type: 'product' | 'service' | 'part'
}

// ─── Repairs ─────────────────────────────────────────────────────

export interface RepairOrder {
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
  status: RepairStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  costEstimate: number
  laborCost: number
  partsCost: number
  totalCost: number
  paymentMethod: string
  paid: boolean
  receivedAt: Date
  estimatedReady: Date | null
  completedAt: Date | null
  deliveredAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  parts: RepairPart[]
  customer?: { name: string } | null
}

export type RepairStatus =
  | 'received'
  | 'diagnosing'
  | 'waiting_parts'
  | 'repairing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface RepairPart {
  id: string
  repairOrderId: string
  productId: string | null
  name: string
  quantity: number
  unitPrice: number
  total: number
}

// ─── Stock ───────────────────────────────────────────────────────

export interface StockMovement {
  id: string
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'return'
  quantity: number
  reason: string | null
  reference: string | null
  userId: string
  userName: string
  createdAt: Date
}

// ─── Expenses ────────────────────────────────────────────────────

export interface Expense {
  id: string
  category: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other'
  description: string
  amount: number
  userId: string
  userName: string
  date: Date
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Audit / Traces ─────────────────────────────────────────────

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ip: string | null
  createdAt: Date
}

// ─── Settings ────────────────────────────────────────────────────

export interface Setting {
  id: string
  key: string
  value: string
}

// ─── Dashboard ───────────────────────────────────────────────────

export interface DashboardData {
  salesToday: { total: number; count: number }
  salesYesterday: { total: number }
  salesWeek: { total: number; count: number }
  salesMonth: { total: number; count: number }
  repairsByStatus: Record<string, number>
  lowStockCount: number
  topProducts: { name: string; total: number; quantity: number }[]
  revenueChart: { date: string; revenue: number; expenses: number }[]
  expensesByCategory: { category: string; total: number }[]
  totalCustomers: number
  totalProducts: number
  pendingRepairs: number
  completedRepairsToday: number
  recentSales: {
    id: string
    code: string
    total: number
    paymentMethod: string
    createdAt: string
    customer: { name: string } | null
  }[]
  recentRepairs: {
    id: string
    code: string
    device: string
    status: string
    totalCost: number
    createdAt: string
    customer: { name: string } | null
  }[]
}

// ─── Export Types ────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'csv' | 'xlsx'

export interface ExportOptions {
  format: ExportFormat
  entity: string
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, string>
}
