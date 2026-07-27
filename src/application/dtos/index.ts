// ============================================================
// DTOs - Data Transfer Objects
// Clean Architecture: Application Business Rules Layer
// These are the data shapes that cross layer boundaries.
// ============================================================

// ─── Pagination ──────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── Auth DTOs ───────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    image?: string | null
  }
  message: string
}

// ─── Product DTOs ────────────────────────────────────────────

export interface CreateProductRequest {
  workshopId: string
  name: string
  sku?: string | null
  description?: string | null
  categoryId?: string | null
  supplierId?: string | null
  costPrice?: number
  salePrice?: number
  quantity?: number
  minStock?: number
  unit?: string
  type?: 'product' | 'service' | 'part'
  brand?: string | null
  model?: string | null
  location?: string | null
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

export interface ProductFilters extends PaginationParams {
  categoryId?: string
  type?: string
  lowStock?: boolean
  active?: string
}

// ─── Sale DTOs ───────────────────────────────────────────────

export interface CreateSaleRequest {
  workshopId: string
  items: CreateSaleItemRequest[]
  discount?: number
  tax?: number
  paymentMethod?: 'efectivo' | 'transferencia' | 'mixto'
  notes?: string | null
}

export interface CreateSaleItemRequest {
  productId?: string | null
  name: string
  quantity?: number
  unitPrice?: number
  discount?: number
  type?: 'product' | 'service' | 'part'
}

export interface SaleFilters extends PaginationParams {
  status?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Repair DTOs ─────────────────────────────────────────────

export interface CreateRepairRequest {
  workshopId: string
  device: string
  brand?: string | null
  imei?: string | null
  issue: string
  diagnosis?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  costEstimate?: number
  estimatedReady?: string | null
  notes?: string | null
}

export interface UpdateRepairRequest extends Partial<CreateRepairRequest> {
  id: string
  status?: string
  solution?: string
  laborCost?: number
  paid?: boolean
}

export interface AddRepairPartRequest {
  productId?: string
  name: string
  quantity?: number
  unitPrice?: number
}

export interface RepairFilters extends PaginationParams {
  status?: string
}

// ─── Category DTOs ───────────────────────────────────────────

export interface CreateCategoryRequest {
  workshopId: string
  name: string
  description?: string | null
  type?: 'product' | 'service' | 'part'
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string
  active?: boolean
}

// ─── Supplier DTOs ───────────────────────────────────────────

export interface CreateSupplierRequest {
  workshopId: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
  active?: boolean
}

// ─── Expense DTOs ────────────────────────────────────────────

export interface CreateExpenseRequest {
  workshopId: string
  category: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other'
  description: string
  amount: number
  date?: string
  notes?: string | null
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: string
}

export interface ExpenseFilters extends PaginationParams {
  category?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Stock DTOs ──────────────────────────────────────────────

export interface AdjustStockRequest {
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'return'
  quantity: number
  reason?: string
  reference?: string
}

// ─── Settings DTOs ───────────────────────────────────────────

export interface UpdateSettingsRequest {
  settings: Array<{ key: string; value: string }>
}

// ─── Audit DTOs ──────────────────────────────────────────────

export interface AuditFilters extends PaginationParams {
  userId?: string
  entity?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}

// ─── Export DTOs ─────────────────────────────────────────────

export interface ExportRequest {
  format: 'pdf' | 'csv' | 'xlsx'
  entity: string
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, string>
}

// ─── Dashboard DTOs ──────────────────────────────────────────

export type DashboardRequest = Record<string, never>
// No params needed currently, reserved for future date range filters

// ─── Backup DTOs ─────────────────────────────────────────────

export interface BackupStatsResponse {
  fileSize: number
  tables: Record<string, number>
  lastBackup: string | null
}

export interface BackupListResponse {
  name: string
  size: number
  createdAt: Date
}

export interface BackupRecordDTO {
  id: string
  filename: string
  format: 'json' | 'sqlite'
  description: string
  size: number
  checksum: string
  stats: Record<string, number>
  createdAt: string
}

export interface CreateBackupRequest {
  format?: 'json' | 'sqlite'
  description?: string
}

export interface RestoreBackupRequest {
  format: 'json' | 'sqlite'
  data?: any // JSON backup data
}

export interface RestoreBackupResponse {
  success: boolean
  message: string
  stats?: Record<string, number>
}

// ─── Workshop DTOs ───────────────────────────────────────────

export interface CreateWorkshopRequest {
  name: string
  slug?: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currency?: string
  timezone?: string
}

export interface UpdateWorkshopRequest {
  id: string
  name?: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  currency?: string
  timezone?: string
  active?: boolean
}

export interface AddWorkshopMemberRequest {
  workshopId: string
  userId?: string
  email?: string
  role: 'owner' | 'employee'
}

export interface UpdateWorkshopMemberRequest {
  workshopId: string
  userId: string
  role: 'owner' | 'employee'
}

export interface WorkshopFilters extends PaginationParams {
  active?: boolean
}

// ─── BI DTOs ─────────────────────────────────────────────────

// ─── Daily Closing DTOs ─────────────────────────────────────

export interface CreateDailyClosingRequest {
  workshopId: string
  date: string
  notes?: string | null
}

export interface CloseDailyClosingRequest {
  id: string
  notes?: string | null
}

export interface DailyClosingFilters extends PaginationParams {
  workshopId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export interface DailyClosingSummary {
  salesCount: number
  salesTotal: number
  repairsCount: number
  repairsTotal: number
  expensesTotal: number
  totalIncome: number
  netTotal: number
}

// ─── BI DTOs ─────────────────────────────────────────────────

export interface WorkshopBI {
  workshopId: string
  workshopName: string
  period: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  salesCount: number
  repairsCount: number
  productsCount: number
  lowStockCount: number
  pendingRepairsCount: number
  completedRepairsToday: number
  revenueChart: { date: string; revenue: number; expenses: number }[]
  topProducts: { name: string; total: number; quantity: number }[]
  expensesByCategory: { category: string; total: number }[]
  salesByPaymentMethod: { method: string; total: number; count: number }[]
  repairsByStatus: Record<string, number>
}

export interface OwnerDashboard {
  totalWorkshops: number
  totalRevenue: number
  totalExpenses: number
  totalNetProfit: number
  workshops: WorkshopBI[]
}
