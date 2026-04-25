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

export interface RegisterRequest {
  email: string
  name: string
  password: string
}

export interface GoogleAuthRequest {
  email: string
  name: string
  image?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    image?: string | null
    provider?: string
  }
  message: string
}

// ─── Product DTOs ────────────────────────────────────────────

export interface CreateProductRequest {
  name: string
  sku?: string
  description?: string
  categoryId?: string
  supplierId?: string
  costPrice?: number
  salePrice?: number
  quantity?: number
  minStock?: number
  unit?: string
  type?: 'product' | 'service' | 'part'
  brand?: string
  model?: string
  location?: string
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

// ─── Customer DTOs ───────────────────────────────────────────

export interface CreateCustomerRequest {
  name: string
  phone?: string
  email?: string
  address?: string
  dni?: string
  notes?: string
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string
}

export interface CustomerFilters extends PaginationParams {
  active?: string
}

// ─── Sale DTOs ───────────────────────────────────────────────

export interface CreateSaleRequest {
  customerId?: string
  items: CreateSaleItemRequest[]
  discount?: number
  tax?: number
  paymentMethod?: 'efectivo' | 'transferencia' | 'mixto'
  notes?: string
}

export interface CreateSaleItemRequest {
  productId?: string
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
  customerId: string
  device: string
  brand?: string
  imei?: string
  issue: string
  diagnosis?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  costEstimate?: number
  estimatedReady?: string
  notes?: string
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
  name: string
  description?: string
  type?: 'product' | 'service' | 'part'
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string
  active?: boolean
}

// ─── Supplier DTOs ───────────────────────────────────────────

export interface CreateSupplierRequest {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
  active?: boolean
}

// ─── Expense DTOs ────────────────────────────────────────────

export interface CreateExpenseRequest {
  category: 'supplies' | 'rent' | 'salary' | 'utilities' | 'other'
  description: string
  amount: number
  date?: string
  notes?: string
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
}

export interface BackupListResponse {
  name: string
  size: number
  createdAt: Date
}

// ─── Workshop DTOs ───────────────────────────────────────────

export interface CreateWorkshopRequest {
  name: string
  slug?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  currency?: string
  timezone?: string
}

export interface UpdateWorkshopRequest {
  id: string
  name?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  currency?: string
  timezone?: string
  active?: boolean
}

export interface AddWorkshopMemberRequest {
  workshopId: string
  userId: string
  role: 'owner' | 'admin' | 'employee'
}

export interface UpdateWorkshopMemberRequest {
  workshopId: string
  userId: string
  role: 'owner' | 'admin' | 'employee'
}

export interface WorkshopFilters extends PaginationParams {
  active?: boolean
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
  customersCount: number
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
