// ============================================================
// Infrastructure Container - Wires infrastructure to application
// Clean Architecture: Infrastructure Layer - Composition Root
// This file creates all infrastructure implementations and
// injects them into the UseCaseContainer via AppDependencies.
// ============================================================

import { UseCaseContainer, type AppDependencies } from '@/application/container'

// Repository implementations
import { PrismaAuthRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-auth.repository'
import { PrismaProductRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-product.repository'
import { PrismaCategoryRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-category.repository'
import { PrismaSupplierRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-supplier.repository'
import { PrismaCustomerRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-customer.repository'
import { PrismaSaleRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-sale.repository'
import { PrismaRepairRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-repair.repository'
import { PrismaExpenseRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-expense.repository'
import { PrismaAuditRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-audit.repository'
import { PrismaSettingsRepository } from '@/infrastructure/persistence/prisma/repositories/prisma-settings.repository'

// Port adapters (bridge infrastructure services to application ports)
import { AuditAdapter } from '@/infrastructure/adapters/audit-adapter'
import { SessionAdapter } from '@/infrastructure/adapters/session-adapter'
import { ExportAdapter } from '@/infrastructure/adapters/export-adapter'
import { BackupAdapter } from '@/infrastructure/adapters/backup-adapter'

// Infrastructure services that directly implement ports
import { PasswordHasher } from '@/infrastructure/auth/password-hasher'
import { CodeGenerator } from '@/infrastructure/services/code-generator'

// ─── Wire Dependencies ──────────────────────────────────────

const deps: AppDependencies = {
  // Repositories
  authRepository: new PrismaAuthRepository(),
  productRepository: new PrismaProductRepository(),
  categoryRepository: new PrismaCategoryRepository(),
  supplierRepository: new PrismaSupplierRepository(),
  customerRepository: new PrismaCustomerRepository(),
  saleRepository: new PrismaSaleRepository(),
  repairRepository: new PrismaRepairRepository(),
  expenseRepository: new PrismaExpenseRepository(),
  auditRepository: new PrismaAuditRepository(),
  settingsRepository: new PrismaSettingsRepository(),

  // Ports (adapters & direct implementations)
  auditPort: new AuditAdapter(),
  sessionPort: new SessionAdapter(),
  passwordPort: new PasswordHasher(),
  exportPort: new ExportAdapter(),
  backupPort: new BackupAdapter(),
  codeGeneratorPort: new CodeGenerator(),
}

// ─── Initialize the Use Case Container ──────────────────────

UseCaseContainer.initialize(deps)

export { deps }
export { UseCaseContainer }
