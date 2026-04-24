// ============================================================
// Repository Interfaces - Contracts for data access
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type {
  User, Category, Supplier, Product, Customer,
  Sale, RepairOrder, Expense, AuditLog, Setting, StockMovement
} from '@/domain/entities'

// ─── Base Repository ─────────────────────────────────────────────

export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>
  findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
  }): Promise<{ data: T[]; total: number }>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

// ─── Auth Repository ─────────────────────────────────────────────

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: { email: string; name: string; password: string; role?: string; provider?: string; image?: string }): Promise<User>
  updatePassword(id: string, password: string): Promise<void>
  findOrCreateGoogleUser(data: { email: string; name: string; image?: string }): Promise<User>
}

// ─── Product Repository ──────────────────────────────────────────

export interface ProductRepository extends BaseRepository<Product> {
  findBySku(sku: string): Promise<Product | null>
  findLowStock(): Promise<Product[]>
  adjustStock(id: string, quantity: number, type: string, reason: string, userId: string, userName: string, reference?: string): Promise<Product>
  getStockMovements(productId: string): Promise<StockMovement[]>
}

// ─── Category Repository ─────────────────────────────────────────

export type CategoryRepository = BaseRepository<Category>

// ─── Supplier Repository ─────────────────────────────────────────

export type SupplierRepository = BaseRepository<Supplier>

// ─── Customer Repository ─────────────────────────────────────────

export interface CustomerRepository extends BaseRepository<Customer> {
  findWithHistory(id: string): Promise<Customer & { sales: Sale[]; repairOrders: RepairOrder[] } | null>
}

// ─── Sale Repository ─────────────────────────────────────────────

export interface SaleRepository extends BaseRepository<Sale> {
  createWithItems(data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'items'>, items: Omit<SaleItem, 'id' | 'saleId'>[]): Promise<Sale>
  findByDateRange(from: Date, to: Date): Promise<Sale[]>
  getSalesStats(from?: Date, to?: Date): Promise<{
    totalRevenue: number
    totalSales: number
    byPaymentMethod: Record<string, number>
    byDay: { date: string; total: number; count: number }[]
  }>
}

// ─── Repair Repository ───────────────────────────────────────────

export interface RepairRepository extends BaseRepository<RepairOrder> {
  findByStatus(status: string): Promise<RepairOrder[]>
  updateStatus(id: string, status: string, data?: Partial<RepairOrder>): Promise<RepairOrder>
  addPart(repairOrderId: string, part: Omit<RepairPart, 'id' | 'repairOrderId'>): Promise<RepairPart>
}

// ─── Expense Repository ──────────────────────────────────────────

export interface ExpenseRepository extends BaseRepository<Expense> {
  findByDateRange(from: Date, to: Date): Promise<Expense[]>
  getByCategory(from?: Date, to?: Date): Promise<{ category: string; total: number }[]>
}

// ─── Audit Repository ────────────────────────────────────────────

export interface AuditRepository {
  log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>
  findMany(params?: {
    userId?: string
    entity?: string
    action?: string
    dateFrom?: Date
    dateTo?: Date
    skip?: number
    take?: number
  }): Promise<{ data: AuditLog[]; total: number }>
  findByEntityId(entity: string, entityId: string): Promise<AuditLog[]>
  getRecent(limit?: number): Promise<AuditLog[]>
}

// ─── Settings Repository ─────────────────────────────────────────

export interface SettingsRepository {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  getAll(): Promise<Setting[]>
  delete(key: string): Promise<void>
}

// Import SaleItem for SaleRepository
import type { SaleItem, RepairPart } from '@/domain/entities'
