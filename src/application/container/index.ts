// ============================================================
// DI Container - Dependency Injection Container
// Clean Architecture: Application Business Rules Layer
// ============================================================

import type {
  AuthRepository,
  ProductRepository,
  CategoryRepository,
  SupplierRepository,
  CustomerRepository,
  SaleRepository,
  RepairRepository,
  ExpenseRepository,
  AuditRepository,
  SettingsRepository,
  WorkshopRepository,
} from '@/domain/repositories'

import type {
  AuditPort,
  SessionPort,
  PasswordPort,
  ExportPort,
  BackupPort,
  CodeGeneratorPort,
} from '@/application/ports'

// Import all use cases
import { LoginUseCase } from '@/application/use-cases/auth/login.use-case'
import { RegisterUseCase } from '@/application/use-cases/auth/register.use-case'
import { GoogleAuthUseCase } from '@/application/use-cases/auth/google-auth.use-case'
import { LogoutUseCase } from '@/application/use-cases/auth/logout.use-case'

import { CreateProductUseCase } from '@/application/use-cases/products/create-product.use-case'
import { GetProductsUseCase } from '@/application/use-cases/products/get-products.use-case'
import { UpdateProductUseCase } from '@/application/use-cases/products/update-product.use-case'
import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product.use-case'

import { CreateSaleUseCase } from '@/application/use-cases/sales/create-sale.use-case'
import { GetSalesUseCase } from '@/application/use-cases/sales/get-sales.use-case'
import { UpdateSaleUseCase } from '@/application/use-cases/sales/update-sale.use-case'
import { DeleteSaleUseCase } from '@/application/use-cases/sales/delete-sale.use-case'

import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair.use-case'
import { GetRepairsUseCase } from '@/application/use-cases/repairs/get-repairs.use-case'
import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair.use-case'
import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair.use-case'
import { AddRepairPartUseCase } from '@/application/use-cases/repairs/add-repair-part.use-case'

import { CreateCustomerUseCase } from '@/application/use-cases/customers/create-customer.use-case'
import { GetCustomersUseCase } from '@/application/use-cases/customers/get-customers.use-case'
import { UpdateCustomerUseCase } from '@/application/use-cases/customers/update-customer.use-case'
import { DeleteCustomerUseCase } from '@/application/use-cases/customers/delete-customer.use-case'

import { CreateCategoryUseCase } from '@/application/use-cases/categories/create-category.use-case'
import { GetCategoriesUseCase } from '@/application/use-cases/categories/get-categories.use-case'
import { UpdateCategoryUseCase } from '@/application/use-cases/categories/update-category.use-case'
import { DeleteCategoryUseCase } from '@/application/use-cases/categories/delete-category.use-case'

import { CreateSupplierUseCase } from '@/application/use-cases/suppliers/create-supplier.use-case'
import { GetSuppliersUseCase } from '@/application/use-cases/suppliers/get-suppliers.use-case'
import { UpdateSupplierUseCase } from '@/application/use-cases/suppliers/update-supplier.use-case'
import { DeleteSupplierUseCase } from '@/application/use-cases/suppliers/delete-supplier.use-case'

import { CreateExpenseUseCase } from '@/application/use-cases/expenses/create-expense.use-case'
import { GetExpensesUseCase } from '@/application/use-cases/expenses/get-expenses.use-case'
import { UpdateExpenseUseCase } from '@/application/use-cases/expenses/update-expense.use-case'
import { DeleteExpenseUseCase } from '@/application/use-cases/expenses/delete-expense.use-case'

import { AdjustStockUseCase } from '@/application/use-cases/stock/adjust-stock.use-case'

import { GetDashboardUseCase } from '@/application/use-cases/dashboard/get-dashboard.use-case'

import { GetAuditLogsUseCase } from '@/application/use-cases/audit/get-audit-logs.use-case'
import { GetAuditStatsUseCase } from '@/application/use-cases/audit/get-audit-stats.use-case'

import { GetSettingsUseCase } from '@/application/use-cases/settings/get-settings.use-case'
import { UpdateSettingsUseCase } from '@/application/use-cases/settings/update-settings.use-case'

import { ExportDataUseCase } from '@/application/use-cases/export/export-data.use-case'

import { CreateBackupUseCase } from '@/application/use-cases/backup/create-backup.use-case'
import { ListBackupsUseCase } from '@/application/use-cases/backup/list-backups.use-case'
import { GetBackupStatsUseCase } from '@/application/use-cases/backup/get-backup-stats.use-case'

import { CreateWorkshopUseCase } from '@/application/use-cases/workshops/create-workshop.use-case'
import { GetWorkshopsUseCase } from '@/application/use-cases/workshops/get-workshops.use-case'
import { GetWorkshopUseCase } from '@/application/use-cases/workshops/get-workshop.use-case'
import { UpdateWorkshopUseCase } from '@/application/use-cases/workshops/update-workshop.use-case'
import { DeleteWorkshopUseCase } from '@/application/use-cases/workshops/delete-workshop.use-case'
import { AddWorkshopMemberUseCase } from '@/application/use-cases/workshops/add-workshop-member.use-case'
import { RemoveWorkshopMemberUseCase } from '@/application/use-cases/workshops/remove-workshop-member.use-case'
import { GetWorkshopMembersUseCase } from '@/application/use-cases/workshops/get-workshop-members.use-case'
import { UpdateWorkshopMemberUseCase } from '@/application/use-cases/workshops/update-workshop-member.use-case'

import { GetWorkshopBIUseCase } from '@/application/use-cases/bi/get-workshop-bi.use-case'
import { GetOwnerDashboardUseCase } from '@/application/use-cases/bi/get-owner-dashboard.use-case'

// ─── Dependencies Interface ──────────────────────────────────

export interface AppDependencies {
  // Repositories
  authRepository: AuthRepository
  productRepository: ProductRepository
  categoryRepository: CategoryRepository
  supplierRepository: SupplierRepository
  customerRepository: CustomerRepository
  saleRepository: SaleRepository
  repairRepository: RepairRepository
  expenseRepository: ExpenseRepository
  auditRepository: AuditRepository
  settingsRepository: SettingsRepository
  workshopRepository: WorkshopRepository

  // Ports
  auditPort: AuditPort
  sessionPort: SessionPort
  passwordPort: PasswordPort
  exportPort: ExportPort
  backupPort: BackupPort
  codeGeneratorPort: CodeGeneratorPort
}

// ─── Use Case Container ─────────────────────────────────────

export class UseCaseContainer {
  private static instance: UseCaseContainer
  private deps: AppDependencies

  private constructor(deps: AppDependencies) {
    this.deps = deps
  }

  static initialize(deps: AppDependencies): UseCaseContainer {
    UseCaseContainer.instance = new UseCaseContainer(deps)
    return UseCaseContainer.instance
  }

  static getInstance(): UseCaseContainer {
    if (!UseCaseContainer.instance) {
      throw new Error('UseCaseContainer not initialized. Call UseCaseContainer.initialize() first.')
    }
    return UseCaseContainer.instance
  }

  // ─── Auth ──────────────────────────────────────────────────

  get login() {
    return new LoginUseCase(
      this.deps.authRepository,
      this.deps.auditPort,
      this.deps.passwordPort,
    )
  }

  get register() {
    return new RegisterUseCase(
      this.deps.authRepository,
      this.deps.auditPort,
      this.deps.passwordPort,
    )
  }

  get googleAuth() {
    return new GoogleAuthUseCase(
      this.deps.authRepository,
      this.deps.auditPort,
    )
  }

  get logout() {
    return new LogoutUseCase(
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Products ──────────────────────────────────────────────

  get createProduct() {
    return new CreateProductUseCase(
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getProducts() {
    return new GetProductsUseCase(
      this.deps.productRepository,
      this.deps.sessionPort,
    )
  }

  get updateProduct() {
    return new UpdateProductUseCase(
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteProduct() {
    return new DeleteProductUseCase(
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Sales ─────────────────────────────────────────────────

  get createSale() {
    return new CreateSaleUseCase(
      this.deps.saleRepository,
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
      this.deps.codeGeneratorPort,
    )
  }

  get getSales() {
    return new GetSalesUseCase(
      this.deps.saleRepository,
      this.deps.sessionPort,
    )
  }

  get updateSale() {
    return new UpdateSaleUseCase(
      this.deps.saleRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteSale() {
    return new DeleteSaleUseCase(
      this.deps.saleRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Repairs ───────────────────────────────────────────────

  get createRepair() {
    return new CreateRepairUseCase(
      this.deps.repairRepository,
      this.deps.customerRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
      this.deps.codeGeneratorPort,
    )
  }

  get getRepairs() {
    return new GetRepairsUseCase(
      this.deps.repairRepository,
      this.deps.sessionPort,
    )
  }

  get updateRepair() {
    return new UpdateRepairUseCase(
      this.deps.repairRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteRepair() {
    return new DeleteRepairUseCase(
      this.deps.repairRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get addRepairPart() {
    return new AddRepairPartUseCase(
      this.deps.repairRepository,
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Customers ─────────────────────────────────────────────

  get createCustomer() {
    return new CreateCustomerUseCase(
      this.deps.customerRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getCustomers() {
    return new GetCustomersUseCase(
      this.deps.customerRepository,
      this.deps.sessionPort,
    )
  }

  get updateCustomer() {
    return new UpdateCustomerUseCase(
      this.deps.customerRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteCustomer() {
    return new DeleteCustomerUseCase(
      this.deps.customerRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Categories ────────────────────────────────────────────

  get createCategory() {
    return new CreateCategoryUseCase(
      this.deps.categoryRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getCategories() {
    return new GetCategoriesUseCase(
      this.deps.categoryRepository,
      this.deps.sessionPort,
    )
  }

  get updateCategory() {
    return new UpdateCategoryUseCase(
      this.deps.categoryRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteCategory() {
    return new DeleteCategoryUseCase(
      this.deps.categoryRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Suppliers ─────────────────────────────────────────────

  get createSupplier() {
    return new CreateSupplierUseCase(
      this.deps.supplierRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getSuppliers() {
    return new GetSuppliersUseCase(
      this.deps.supplierRepository,
      this.deps.sessionPort,
    )
  }

  get updateSupplier() {
    return new UpdateSupplierUseCase(
      this.deps.supplierRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteSupplier() {
    return new DeleteSupplierUseCase(
      this.deps.supplierRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Expenses ──────────────────────────────────────────────

  get createExpense() {
    return new CreateExpenseUseCase(
      this.deps.expenseRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getExpenses() {
    return new GetExpensesUseCase(
      this.deps.expenseRepository,
      this.deps.sessionPort,
    )
  }

  get updateExpense() {
    return new UpdateExpenseUseCase(
      this.deps.expenseRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteExpense() {
    return new DeleteExpenseUseCase(
      this.deps.expenseRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Stock ─────────────────────────────────────────────────

  get adjustStock() {
    return new AdjustStockUseCase(
      this.deps.productRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Dashboard ─────────────────────────────────────────────

  get getDashboard() {
    return new GetDashboardUseCase(
      this.deps.saleRepository,
      this.deps.repairRepository,
      this.deps.productRepository,
      this.deps.expenseRepository,
      this.deps.customerRepository,
      this.deps.sessionPort,
    )
  }

  // ─── Audit ─────────────────────────────────────────────────

  get getAuditLogs() {
    return new GetAuditLogsUseCase(
      this.deps.auditRepository,
      this.deps.sessionPort,
    )
  }

  get getAuditStats() {
    return new GetAuditStatsUseCase(
      this.deps.auditRepository,
      this.deps.sessionPort,
    )
  }

  // ─── Settings ──────────────────────────────────────────────

  get getSettings() {
    return new GetSettingsUseCase(
      this.deps.settingsRepository,
      this.deps.sessionPort,
    )
  }

  get updateSettings() {
    return new UpdateSettingsUseCase(
      this.deps.settingsRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Export ────────────────────────────────────────────────

  get exportData() {
    return new ExportDataUseCase(
      this.deps.exportPort,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── Backup ────────────────────────────────────────────────

  get createBackup() {
    return new CreateBackupUseCase(
      this.deps.backupPort,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get listBackups() {
    return new ListBackupsUseCase(
      this.deps.backupPort,
      this.deps.sessionPort,
    )
  }

  get getBackupStats() {
    return new GetBackupStatsUseCase(
      this.deps.backupPort,
      this.deps.sessionPort,
    )
  }

  // ─── Workshops ──────────────────────────────────────────────

  get createWorkshop() {
    return new CreateWorkshopUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getWorkshops() {
    return new GetWorkshopsUseCase(
      this.deps.workshopRepository,
      this.deps.sessionPort,
    )
  }

  get getWorkshop() {
    return new GetWorkshopUseCase(
      this.deps.workshopRepository,
      this.deps.sessionPort,
    )
  }

  get updateWorkshop() {
    return new UpdateWorkshopUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get deleteWorkshop() {
    return new DeleteWorkshopUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get addWorkshopMember() {
    return new AddWorkshopMemberUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get removeWorkshopMember() {
    return new RemoveWorkshopMemberUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  get getWorkshopMembers() {
    return new GetWorkshopMembersUseCase(
      this.deps.workshopRepository,
      this.deps.sessionPort,
    )
  }

  get updateWorkshopMember() {
    return new UpdateWorkshopMemberUseCase(
      this.deps.workshopRepository,
      this.deps.auditPort,
      this.deps.sessionPort,
    )
  }

  // ─── BI ────────────────────────────────────────────────────

  get getWorkshopBI() {
    return new GetWorkshopBIUseCase(
      this.deps.workshopRepository,
      this.deps.saleRepository,
      this.deps.repairRepository,
      this.deps.productRepository,
      this.deps.expenseRepository,
      this.deps.customerRepository,
      this.deps.sessionPort,
    )
  }

  get getOwnerDashboard() {
    return new GetOwnerDashboardUseCase(
      this.deps.workshopRepository,
      this.deps.saleRepository,
      this.deps.repairRepository,
      this.deps.productRepository,
      this.deps.expenseRepository,
      this.deps.customerRepository,
      this.deps.sessionPort,
    )
  }

  // ─── All Use Cases ─────────────────────────────────────────

  get all() {
    return {
      // Auth
      login: this.login,
      register: this.register,
      googleAuth: this.googleAuth,
      logout: this.logout,
      // Products
      createProduct: this.createProduct,
      getProducts: this.getProducts,
      updateProduct: this.updateProduct,
      deleteProduct: this.deleteProduct,
      // Sales
      createSale: this.createSale,
      getSales: this.getSales,
      updateSale: this.updateSale,
      deleteSale: this.deleteSale,
      // Repairs
      createRepair: this.createRepair,
      getRepairs: this.getRepairs,
      updateRepair: this.updateRepair,
      deleteRepair: this.deleteRepair,
      addRepairPart: this.addRepairPart,
      // Customers
      createCustomer: this.createCustomer,
      getCustomers: this.getCustomers,
      updateCustomer: this.updateCustomer,
      deleteCustomer: this.deleteCustomer,
      // Categories
      createCategory: this.createCategory,
      getCategories: this.getCategories,
      updateCategory: this.updateCategory,
      deleteCategory: this.deleteCategory,
      // Suppliers
      createSupplier: this.createSupplier,
      getSuppliers: this.getSuppliers,
      updateSupplier: this.updateSupplier,
      deleteSupplier: this.deleteSupplier,
      // Expenses
      createExpense: this.createExpense,
      getExpenses: this.getExpenses,
      updateExpense: this.updateExpense,
      deleteExpense: this.deleteExpense,
      // Stock
      adjustStock: this.adjustStock,
      // Dashboard
      getDashboard: this.getDashboard,
      // Audit
      getAuditLogs: this.getAuditLogs,
      getAuditStats: this.getAuditStats,
      // Settings
      getSettings: this.getSettings,
      updateSettings: this.updateSettings,
      // Export
      exportData: this.exportData,
      // Backup
      createBackup: this.createBackup,
      listBackups: this.listBackups,
      getBackupStats: this.getBackupStats,
      // Workshops
      createWorkshop: this.createWorkshop,
      getWorkshops: this.getWorkshops,
      getWorkshop: this.getWorkshop,
      updateWorkshop: this.updateWorkshop,
      deleteWorkshop: this.deleteWorkshop,
      addWorkshopMember: this.addWorkshopMember,
      removeWorkshopMember: this.removeWorkshopMember,
      getWorkshopMembers: this.getWorkshopMembers,
      updateWorkshopMember: this.updateWorkshopMember,
      // BI
      getWorkshopBI: this.getWorkshopBI,
      getOwnerDashboard: this.getOwnerDashboard,
    }
  }
}
