// ============================================================
// Domain Entities - Rich domain entities with business logic
// Clean Architecture: Enterprise Business Rules Layer
// ============================================================

// ─── Entity Classes ─────────────────────────────────────────────

export { User } from './user'
export { Product } from './product'
export { Customer } from './customer'
export { Sale } from './sale'
export { SaleItem } from './sale-item'
export { RepairOrder } from './repair-order'
export { RepairPart } from './repair-part'
export { Category } from './category'
export { Supplier } from './supplier'
export { Expense } from './expense'
export { StockMovement, STOCK_MOVEMENT_TYPES } from './stock-movement'
export type { StockMovementType } from './stock-movement'
export { AuditLog } from './audit-log'
export { Setting } from './setting'
export { Workshop } from './workshop'
export type { WorkshopMember, WorkshopWithRole, WorkshopRole } from './workshop'

// ─── Value Object Re-exports (for convenience) ──────────────────
export { RepairStatus, REPAIR_STATUSES } from '../value-objects'
export type { RepairStatusValue } from '../value-objects'

// ─── Backward-Compatible Interface Types ─────────────────────────
// These types match the original interface shapes for consumers
// that still depend on plain object types.

export interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  image?: string | null
  provider?: string
}

/**
 * Backward-compatible string union type for repair status values.
 * For the rich value object, use `RepairStatus` (imported from value-objects above).
 */
export type RepairStatusString =
  | 'received'
  | 'diagnosing'
  | 'waiting_parts'
  | 'repairing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

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
