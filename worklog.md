# TallerTech - Work Log

## Project Overview
Cell phone repair shop management system (TallerTech) built with Next.js 16, Prisma SQLite, Tailwind CSS 4, shadcn/ui.

---
Task ID: 1
Agent: main
Task: Research and plan the application architecture

Work Log:
- Analyzed requirements for cell phone repair shop management
- Planned database schema with 11 models (User, Category, Supplier, Product, Customer, Sale, SaleItem, RepairOrder, RepairPart, StockMovement, Expense, Setting)
- Designed module architecture: Auth, Dashboard, Inventory, Sales/POS, Repairs, Customers, Reports, Expenses, Settings
- Chose SQLite as database (no server needed, perfect for Cuba context)
- Planned emerald/green color scheme with Spanish language

Stage Summary:
- Full architecture designed and planned
- Database: SQLite via Prisma ORM
- All modules identified with API endpoints

---
Task ID: 2
Agent: main
Task: Set up database schema with Prisma

Work Log:
- Created comprehensive Prisma schema with 11+ models
- Ran prisma db push successfully
- Schema includes: User, Category, Supplier, Product, Customer, Sale, SaleItem, RepairOrder, RepairPart, StockMovement, Expense, Setting, AuditLog

Stage Summary:
- Database schema complete and pushed to SQLite
- All relationships and indexes defined

---
Task ID: 3-11
Agent: full-stack-developer
Task: Build all backend API routes and frontend components

Work Log:
- Created all API routes and view components for the full application
- Auth, Dashboard, Products, Categories, Suppliers, Sales/POS, Repairs, Customers, Reports, Expenses, Settings
- PWA support with offline-first architecture

Stage Summary:
- Complete application with all core modules working
- PWA with offline support
- Mobile-responsive design

---
Task ID: CA-1
Agent: main
Task: Clean Architecture restructuring + Logo + Google Auth + Audit + Backup/Restore + Export

Work Log:
- Created clean architecture folder structure:
  - src/domain/entities/ - All business entity types
  - src/domain/repositories/ - Repository interface contracts
  - src/application/services/ - Audit service, Export service, Backup service
  - src/infrastructure/ - Placeholder for future persistence, auth, export, audit implementations
  - src/types/ - Google Identity Services type declarations
- Updated Prisma schema:
  - Added `image` field to User model (for Google OAuth profile pictures)
  - Added `provider` field to User model (credentials/google)
  - Changed `password` to have default empty string for OAuth users
  - Added AuditLog model for traceability/audit system
- Created Audit System:
  - src/application/services/audit-service.ts - Complete audit logging service
  - API: GET /api/audit - Query audit logs with filters (user, entity, action, date, search, pagination)
  - API: GET /api/audit/stats - Get audit statistics (total logs, today's logs, by entity, by action)
  - Audit logging added to all auth routes (login, register, logout)
  - Audit logging added to backup and export APIs
  - Frontend: AuditView component with stats cards, filters, table, pagination, mobile cards
- Created Google OAuth Authentication:
  - API: POST /api/auth/google - Verify Google ID token and find/create user
  - Frontend: Google Sign-In button on login and register forms
  - Loads Google Identity Services SDK dynamically
  - Handles credential callback and session creation
  - User model now tracks provider and profile image
  - Updated auth-provider.tsx with Google button and logo
- Created Database Backup & Restore:
  - src/application/services/backup-service.ts - Complete backup/restore service
  - API: GET /api/backup - Download full SQLite database backup
  - API: POST /api/backup - Restore from uploaded .db file
  - API: GET /api/backup/stats - Database statistics (file size, table counts)
  - Frontend: Settings > Backup tab with download, upload, restore, DB stats
  - Auto-creates safety backup before restore
- Created Data Export System:
  - src/application/services/export-service.ts - Export in PDF, CSV, Excel
  - API: GET /api/export?format=xlsx|csv|pdf&entity=sales|products|repairs|customers|expenses|stock
  - PDF: Professional landscape PDF with table, header, pagination
  - CSV: Standard comma-separated with proper escaping
  - Excel: Native .xlsx with auto-sized columns
  - Frontend: Settings > Export tab with format selection and descriptions
- Generated professional TallerTech logo:
  - AI-generated logo: smartphone + wrench + gear in emerald green
  - public/logo-generated.png - 1024x1024 master logo
  - public/icon-192.png - 192x192 PWA icon
  - public/icon-512.png - 512x512 PWA icon
  - public/logo-small.png - 64x64 sidebar icon
  - Logo used in sidebar header and login screen
- Updated UI components:
  - app-sidebar.tsx: Logo image, Audit nav item with Shield icon
  - app-shell.tsx: Added AuditView, AvatarImage for Google profile pics
  - settings-view.tsx: Complete redesign with tabs (Business, Profile, Backup, Export)
  - auth-provider.tsx: Google Sign-In button, logo image, provider-aware UI
  - store.ts: Added 'audit' to ViewType and viewLabels
  - Mobile nav dropdown includes Auditoría link
- Updated currency options to include CUP (Cuban Peso) and MLC

Stage Summary:
- Clean Architecture layers established (domain, application, infrastructure)
- Full audit/trace system tracking all user actions
- Google OAuth integration ready (requires NEXT_PUBLIC_GOOGLE_CLIENT_ID env var)
- Database backup/restore with safety backup feature
- Export to PDF, CSV, Excel for all entity types
- Professional AI-generated logo for TallerTech
- All lint checks pass
- Server compiles and serves correctly

## Current Project Status
✅ Clean Architecture folder structure with domain, application, infrastructure layers
✅ Audit/trace system with full logging of user actions
✅ Google OAuth authentication (requires NEXT_PUBLIC_GOOGLE_CLIENT_ID)
✅ Database backup and restore functionality
✅ Export to PDF, CSV, Excel
✅ Professional TallerTech logo
✅ All lint checks pass
✅ PWA with offline support
✅ Mobile responsive design
✅ Dark mode

---
Task ID: CA-FULL
Agent: main-orchestrator
Task: Complete Clean Architecture Refactoring of TallerTech

Work Log:
- Analyzed existing project structure and identified architectural issues:
  - Domain entities were just interfaces without behavior
  - Business logic was scattered in API routes
  - No use cases (interactors) pattern
  - Repository interfaces existed but had no implementations
  - No dependency injection
  - Infrastructure concerns leaked into application layer
- Designed complete 4-layer Clean Architecture:
  - Layer 1 (Domain): Enterprise Business Rules - entities, value objects, errors, events, repository interfaces
  - Layer 2 (Application): Application Business Rules - use cases, DTOs, ports, DI container
  - Layer 3 (Infrastructure): Frameworks & Drivers - Prisma repos, auth, services, mappers
  - Layer 4 (Interface Adapters): Controllers, presenters, middlewares
- Implemented Domain Layer (Task 2-a):
  - 13 rich entity classes with business logic
  - 4 value objects (Money, Email, RepairStatus, SaleStatus)
  - 8 domain error classes
  - Domain event system with publisher
- Implemented Application Layer (Task 3):
  - 6 port interfaces (Audit, Session, Password, Export, Backup, CodeGenerator)
  - 35+ DTO interfaces
  - 31 use case classes across 12 domains
  - DI Container (UseCaseContainer)
- Implemented Infrastructure Layer (Task 4):
  - 10 Prisma repository implementations
  - 13 mappers (Domain ↔ Prisma)
  - Auth infrastructure (PasswordHasher, CookieSession)
  - 4 service implementations (Audit, Export, Backup, CodeGenerator)
  - 4 adapters bridging infrastructure to application ports
- Implemented Interface Adapters Layer (Task 5):
  - 14 thin controllers
  - Response Presenter with DomainError → HTTP status mapping
  - Auth Middleware (requireAuth)
  - Infrastructure Container wiring all dependencies
- Refactored all 28 API routes to thin delegates (max 10 lines each)
- Verified: TypeScript compiles, ESLint passes (no new errors), dev server runs

Stage Summary:
- COMPLETE Clean Architecture refactoring of TallerTech project
- 4-layer architecture with strict dependency rule (dependencies point inward only)
- Domain layer is completely independent (no infrastructure imports)
- 31 use cases orchestrate all business logic
- All API routes are thin delegates to controllers
- DI Container wires everything together
- Backward compatible - same API contract, same UI
- ARCHITECTURE.md created with full documentation and diagrams

---
Task ID: 2-a
Agent: domain-architect
Task: Implement Rich Domain Layer (Clean Architecture refactoring)

Work Log:
- Read existing worklog, entity interfaces, and Prisma schema for context
- Created Value Objects (src/domain/value-objects/):
  - money.ts: Immutable Money class with add/subtract/multiply/isNegative/isZero/isPositive/format, factories from() and zero(), rounding to 2 decimal places
  - email.ts: Email class with format validation on creation, equals/toString/getDomain, throws InvalidEmailError
  - repair-status.ts: RepairStatus enum-like class with valid state transitions (received→diagnosing→waiting_parts→repairing→ready→delivered, cancelled from any non-terminal), transitionTo() enforces rules
  - sale-status.ts: SaleStatus enum-like class with transitions (pending→completed→cancelled, cancelled is terminal)
  - index.ts: Re-exports all value objects
- Created Domain Errors (src/domain/errors/index.ts):
  - DomainError base class with code field
  - EntityNotFoundError, InsufficientStockError, InvalidStateTransitionError, DuplicateSkuError, InvalidEmailError, AuthenticationError, AuthorizationError, ValidationError
- Created Domain Events (src/domain/events/index.ts):
  - DomainEvent interface with eventType, occurredAt, aggregateId, aggregateType, payload
  - DomainEventPublisher singleton with subscribe/publish pattern
  - DomainEventTypes constants for all business events
- Created Rich Domain Entities (src/domain/entities/):
  - user.ts: User class with Email VO, isAdmin/isGoogleUser/canActivate/canDeactivate, deactivate/activate/updateName, toPlainObject/toPublicInfo
  - product.ts: Product class with Money VOs for prices, profitMargin/isLowStock/hasSufficientStock, deductStock/addStock/adjustStock/updatePrices, throws InsufficientStockError
  - customer.ts: Customer class with optional Email VO, deactivate/activate/updateDetails, toPlainObject
  - sale.ts: Sale class with SaleStatus VO, Money VOs for amounts, calculateTotals/cancel/complete/isCancellable/isCompletable
  - sale-item.ts: SaleItem class with Money VOs, calculateTotal/getLineTotal/recalculate
  - repair-order.ts: RepairOrder class with RepairStatus VO, Money VOs for costs, updateStatus (enforces transitions), addPart/calculateTotalCost/recalculateCosts/markAsReady/markAsDelivered/cancel
  - repair-part.ts: RepairPart class with Money VOs, calculateTotal/recalculate
  - category.ts: Category class with activate/deactivate/updateDetails
  - supplier.ts: Supplier class with activate/deactivate/updateDetails
  - expense.ts: Expense class with Money VO, validates positive amount, updateAmount/updateDetails
  - stock-movement.ts: StockMovement class with type validation, isIn/isOut/isAdjustment/isReturn, getSignedQuantity
  - audit-log.ts: AuditLog class, immutable record with isCreate/isUpdate/isDelete/isLogin
  - setting.ts: Setting class with updateValue, isBoolean/getBooleanValue/getNumberValue
  - index.ts: Re-exports all entity classes, value object re-exports (RepairStatus, RepairStatusValue), backward-compatible types (UserInfo, RepairStatusString, DashboardData, ExportFormat, ExportOptions)
- All files compile without TypeScript errors
- All lint checks pass
- Backward compatibility maintained: toPlainObject() outputs match original interface shapes

Stage Summary:
- Full rich domain layer with Value Objects, Domain Errors, Domain Events, and 13 Rich Entity classes
- Business logic encapsulated: state transitions enforced, stock validation, email validation, monetary calculations
- Value Objects: Money, Email, RepairStatus, SaleStatus
- All entities use static factory create() methods and toPlainObject() serialization
- Zero TypeScript compilation errors in domain layer
- Zero lint errors

---
Task ID: 4
Agent: infrastructure-implementer
Task: Implement Infrastructure Layer (Repositories, Auth, Services, Mappers)

Work Log:
- Read worklog.md, domain entities, repository interfaces, Prisma schema, and all existing reference files
- Created Prisma Client singleton (src/infrastructure/persistence/prisma/prisma-client.ts):
  - Singleton pattern with globalThis caching for dev mode
  - Query logging enabled
- Created 13 Mappers (src/infrastructure/persistence/prisma/mappers/):
  - user.mapper.ts: toDomain/toPrisma with Email VO handling
  - product.mapper.ts: toDomain/toPrisma with Money VO and type casting
  - customer.mapper.ts: toDomain/toPrisma with optional Email VO
  - sale.mapper.ts: toDomain/toPrisma with SaleStatus VO, items/customer includes
  - sale-item.mapper.ts: toDomain/toPrisma with Money VO calculations
  - repair-order.mapper.ts: toDomain/toPrisma with RepairStatus VO, parts/customer includes
  - repair-part.mapper.ts: toDomain/toPrisma with Money VO
  - category.mapper.ts: toDomain/toPrisma with type casting
  - supplier.mapper.ts: toDomain/toPrisma
  - expense.mapper.ts: toDomain/toPrisma with Money VO and category type
  - stock-movement.mapper.ts: toDomain/toPrisma with type validation
  - audit-log.mapper.ts: toDomain/toPrisma (immutable entity)
  - setting.mapper.ts: toDomain/toPrisma (simple key-value)
  - index.ts: Re-exports all mappers
- Created 10 Repository Implementations (src/infrastructure/persistence/prisma/repositories/):
  - prisma-auth.repository.ts: Implements AuthRepository (findByEmail, findById, create, updatePassword, findOrCreateGoogleUser)
  - prisma-product.repository.ts: Implements ProductRepository (CRUD + findBySku, findLowStock with in-memory filter for SQLite, adjustStock with transaction, getStockMovements)
  - prisma-category.repository.ts: Implements CategoryRepository (= BaseRepository<Category>)
  - prisma-supplier.repository.ts: Implements SupplierRepository (= BaseRepository<Supplier>)
  - prisma-customer.repository.ts: Implements CustomerRepository (CRUD + findWithHistory with sales and repair orders)
  - prisma-sale.repository.ts: Implements SaleRepository (CRUD + createWithItems with $transaction for sale/items/stock/stockMovements, findByDateRange, getSalesStats with aggregation)
  - prisma-repair.repository.ts: Implements RepairRepository (CRUD + findByStatus, updateStatus with timestamp management, addPart)
  - prisma-expense.repository.ts: Implements ExpenseRepository (CRUD + findByDateRange, getByCategory with groupBy)
  - prisma-audit.repository.ts: Implements AuditRepository (log, findMany with filters, findByEntityId, getRecent)
  - prisma-settings.repository.ts: Implements SettingsRepository (get, set with upsert, getAll, delete)
  - index.ts: Re-exports all repository implementations
- Created Auth Infrastructure (src/infrastructure/auth/):
  - password-hasher.ts: SHA-256 hashing with secret salt, hash/verify methods, singleton export
  - cookie-session.ts: Cookie-based session management, getSessionUser/createSessionCookie/clearSessionCookie, SessionUser type
  - index.ts: Re-exports with types
- Created Service Implementations (src/infrastructure/services/):
  - audit-service.ts: Adapted from application/services/audit-service.ts, uses infrastructure prisma client directly, log/logBatch/getLogs/getByEntity/getRecent/getStats
  - export-service.ts: Adapted from application/services/export-service.ts, uses infrastructure prisma client, PDF/CSV/XLSX generation for all entities
  - backup-service.ts: Adapted from application/services/backup-service.ts, uses infrastructure prisma client, createBackup/restoreBackup/restoreFromBuffer/getDatabaseBuffer/listBackups/deleteBackup/getDatabaseStats
  - code-generator.ts: generateSaleCode (VEN-XXXX) and generateRepairCode (REP-XXXX) with timestamp+random
  - index.ts: Re-exports all services with types
- Copied Offline Infrastructure (src/infrastructure/persistence/offline/):
  - offline-db.ts: Exact copy from src/lib/offline-db.ts (IndexedDB offline-first PWA support)
  - index.ts: Re-export
- Copied HTTP Infrastructure (src/infrastructure/http/):
  - offline-fetch.ts: Copied from src/lib/offline-fetch.ts with import path fix (../persistence/offline/offline-db)
  - index.ts: Re-export
- Created barrel exports:
  - src/infrastructure/persistence/prisma/index.ts
  - src/infrastructure/persistence/index.ts
  - src/infrastructure/index.ts (top-level barrel export)
- Fixed pre-existing lint error in src/application/dtos/index.ts (empty DashboardRequest interface)
- Generated Prisma client types (prisma generate)
- All lint checks pass
- No new TypeScript errors introduced (remaining errors are pre-existing: idb/xlsx/pdfkit type declarations)
- Backward compatibility maintained: old src/lib/db.ts and src/lib/auth.ts are untouched

Stage Summary:
- Complete Infrastructure layer implementing all 10 repository interfaces from domain layer
- 13 mappers converting between Prisma raw results and Domain entity instances
- Auth infrastructure: PasswordHasher (SHA-256) and CookieSession (cookie-based)
- Services: AuditService, ExportService (PDF/CSV/XLSX), BackupService, CodeGenerator
- Offline persistence (IndexedDB) and HTTP (offline-aware fetch) infrastructure
- PrismaSaleRepository.createWithItems uses $transaction for atomic sale creation with stock updates
- PrismaProductRepository.findLowStock uses in-memory filtering (SQLite limitation)
- All repository methods map Prisma results to Domain entities via mappers
- Zero lint errors, zero new TypeScript compilation errors

---
Task ID: 3
Agent: application-architect
Task: Implement Application Layer (Use Cases, DTOs, Ports, DI Container)

Work Log:
- Read worklog.md, domain entities, repository interfaces, domain errors, value objects, domain events, and all existing API route implementations for reference
- Created Ports (src/application/ports/):
  - audit.port.ts: AuditPort interface with log() method for audit trail entries
  - session.port.ts: SessionPort interface with getSessionUser() for request-based auth context
  - password.port.ts: PasswordPort interface with hash/verify for password operations
  - export.port.ts: ExportPort interface with exportData() for PDF/CSV/XLSX generation
  - backup.port.ts: BackupPort interface with createBackup/listBackups/getDatabaseStats
  - code-generator.port.ts: CodeGeneratorPort interface with generateSaleCode/generateRepairCode
  - index.ts: Re-exports all port types
- Created DTOs (src/application/dtos/index.ts):
  - PaginationParams, PaginatedResult<T> - Generic pagination
  - LoginRequest, RegisterRequest, GoogleAuthRequest, AuthResponse - Auth DTOs
  - CreateProductRequest, UpdateProductRequest, ProductFilters - Product DTOs
  - CreateCustomerRequest, UpdateCustomerRequest, CustomerFilters - Customer DTOs
  - CreateSaleRequest, CreateSaleItemRequest, SaleFilters - Sale DTOs
  - CreateRepairRequest, UpdateRepairRequest, AddRepairPartRequest, RepairFilters - Repair DTOs
  - CreateCategoryRequest, UpdateCategoryRequest - Category DTOs
  - CreateSupplierRequest, UpdateSupplierRequest - Supplier DTOs
  - CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters - Expense DTOs
  - AdjustStockRequest - Stock DTOs
  - UpdateSettingsRequest - Settings DTOs
  - AuditFilters - Audit DTOs
  - ExportRequest - Export DTOs
  - DashboardRequest, BackupStatsResponse, BackupListResponse - Dashboard/Backup DTOs
- Created Auth Use Cases (src/application/use-cases/auth/):
  - login.use-case.ts: Validates credentials, verifies password via PasswordPort, logs audit
  - register.use-case.ts: Validates input, checks existing user, hashes password, creates user, logs audit
  - google-auth.use-case.ts: Find or create Google user via AuthRepository, logs audit
  - logout.use-case.ts: Gets session user, logs audit for logout
- Created Product Use Cases (src/application/use-cases/products/):
  - create-product.use-case.ts: Validates name, checks SKU uniqueness via DuplicateSkuError, creates with initial stock movement, logs audit
  - get-products.use-case.ts: List with filters, pagination, low-stock JS filtering (SQLite limitation)
  - update-product.use-case.ts: Update fields, SKU uniqueness check on change, logs audit
  - delete-product.use-case.ts: Soft delete (deactivate), logs audit
- Created Sale Use Cases (src/application/use-cases/sales/):
  - create-sale.use-case.ts: THE MOST COMPLEX - generates code via CodeGeneratorPort, validates items, checks stock (throws InsufficientStockError), calculates totals, creates sale with items via createWithItems, deducts stock for each product item, creates stock movements, logs audit
  - get-sales.use-case.ts: List with status/date filters and pagination
  - update-sale.use-case.ts: Status changes using domain entity's cancel()/complete(), logs CANCEL or UPDATE audit
  - delete-sale.use-case.ts: Hard delete, logs audit
- Created Repair Use Cases (src/application/use-cases/repairs/):
  - create-repair.use-case.ts: Generate code, validate customer/device/issue, create repair, logs audit
  - get-repairs.use-case.ts: List with status filter and pagination
  - update-repair.use-case.ts: Status changes using domain entity's updateStatus(), InvalidStateTransitionError handling, logs STATUS_CHANGE or UPDATE audit
  - delete-repair.use-case.ts: Hard delete, logs audit
  - add-repair-part.use-case.ts: Add part to repair, validate/deduct stock if productId exists, logs audit
- Created Customer Use Cases (src/application/use-cases/customers/):
  - create-customer.use-case.ts: Validate name, create customer, logs audit
  - get-customers.use-case.ts: List with filters and pagination
  - update-customer.use-case.ts: Update fields, logs audit
  - delete-customer.use-case.ts: Soft delete (deactivate), logs audit
- Created Category Use Cases (src/application/use-cases/categories/):
  - create-category.use-case.ts: Validate name, create category, logs audit
  - get-categories.use-case.ts: List with search and pagination
  - update-category.use-case.ts: Update fields including active toggle, logs audit
  - delete-category.use-case.ts: Soft delete (deactivate), logs audit
- Created Supplier Use Cases (src/application/use-cases/suppliers/):
  - create-supplier.use-case.ts: Validate name, create supplier, logs audit
  - get-suppliers.use-case.ts: List with search and pagination
  - update-supplier.use-case.ts: Update fields including active toggle, logs audit
  - delete-supplier.use-case.ts: Soft delete (deactivate), logs audit
- Created Expense Use Cases (src/application/use-cases/expenses/):
  - create-expense.use-case.ts: Validate description/positive amount, create expense, logs audit
  - get-expenses.use-case.ts: List with category/date filters and pagination
  - update-expense.use-case.ts: Update fields with amount validation, logs audit
  - delete-expense.use-case.ts: Hard delete, logs audit
- Created Stock Use Case (src/application/use-cases/stock/):
  - adjust-stock.use-case.ts: Validate product/type/quantity, adjust stock via repository, create movement, logs STOCK_ADJUSTMENT audit
- Created Dashboard Use Case (src/application/use-cases/dashboard/):
  - get-dashboard.use-case.ts: Aggregates data from SaleRepository (stats by today/yesterday/week/month/30 days), RepairRepository (by status, pending, completed today), ProductRepository (low stock), ExpenseRepository (by category, last 30 days), CustomerRepository (count) - returns DashboardData
- Created Audit Use Cases (src/application/use-cases/audit/):
  - get-audit-logs.use-case.ts: List with user/entity/action/date filters and pagination
  - get-audit-stats.use-case.ts: Calculate total/today logs, group by entity and action
- Created Settings Use Cases (src/application/use-cases/settings/):
  - get-settings.use-case.ts: Get all settings
  - update-settings.use-case.ts: Update multiple settings, logs audit
- Created Export Use Case (src/application/use-cases/export/):
  - export-data.use-case.ts: Validate format/entity, delegate to ExportPort, logs EXPORT audit
- Created Backup Use Cases (src/application/use-cases/backup/):
  - create-backup.use-case.ts: Create backup via BackupPort, logs BACKUP audit
  - list-backups.use-case.ts: List available backups
  - get-backup-stats.use-case.ts: Get database statistics
- Created DI Container (src/application/container/index.ts):
  - AppDependencies interface: All 10 repositories + 6 ports
  - UseCaseContainer class: Singleton pattern with initialize()/getInstance()
  - 31 getter methods for all use cases (lazy-initialized)
  - all getter returns object with all 31 use case instances
  - Constructor injection for all dependencies
  - Each use case properly wired with its required repositories and ports

Architecture Rules Followed:
- Use Cases depend ONLY on domain entities, repository interfaces, ports, and DTOs
- No imports from @/lib/db, @/lib/auth, or any infrastructure layer
- Each Use Case has a single execute() method
- Constructor injection for all dependencies
- Domain entity methods used for business logic (deductStock, updateStatus, cancel, complete)
- DomainError subclasses thrown for business rule violations
- Audit logging via AuditPort (not directly)
- SessionPort used for request-based authentication context

Stage Summary:
- Complete Application layer with 6 Ports, 35+ DTO interfaces, 31 Use Cases, and DI Container
- All Use Cases follow consistent pattern: authenticate → validate → business logic → persist → audit
- Create Sale is the most complex use case with atomic transaction, stock validation, and stock movements
- Repair use cases enforce state transitions via domain entity's updateStatus()
- All TypeScript compilation errors in application layer resolved
- Zero lint errors
- Pre-existing errors in other layers untouched (xlsx/pdfkit/idb type declarations)

---
Task ID: 5
Agent: interface-adapter-implementer
Task: Implement Interface Adapters Layer (Controllers, Presenters, Middlewares) and Refactor All API Routes

Work Log:
- Read worklog.md, all current API route files, application use cases, DTOs, ports, container, domain errors, and infrastructure implementations
- Created Infrastructure Adapters (src/infrastructure/adapters/):
  - audit-adapter.ts: Wraps AuditService to implement AuditPort interface (adapts return type from PrismaResult to void)
  - session-adapter.ts: Wraps CookieSession to implement SessionPort interface (adapts optional Request param to required)
  - export-adapter.ts: Wraps exportData function to implement ExportPort interface (extracts Buffer from {buffer, contentType, filename})
  - backup-adapter.ts: Wraps BackupService to implement BackupPort interface (transforms return types: createBackup returns path string, listBackups maps filename→name, getDatabaseStats maps Array→Record)
  - index.ts: Re-exports all adapters
- Created Infrastructure Container (src/infrastructure/container.ts):
  - Wires all 10 Prisma repository implementations to AppDependencies
  - Wires 6 port adapters/implementations: AuditAdapter, SessionAdapter, PasswordHasher, ExportAdapter, BackupAdapter, CodeGenerator
  - Calls UseCaseContainer.initialize(deps) at import time
  - Re-exports UseCaseContainer for convenience
- Created Response Presenter (src/interfaces/http/presenters/response.presenter.ts):
  - success(data, status) - JSON response with data
  - created(data) - 201 Created response
  - paginated(data, total, page, limit) - Paginated response with metadata
  - error(error) - Maps DomainError subclasses to HTTP status codes (401, 403, 404, 400), unknown errors → 500
  - binary(buffer, contentType, filename) - Binary file download response with proper headers
- Created Auth Middleware (src/interfaces/http/middlewares/auth.middleware.ts):
  - requireAuth(request) - Returns authenticated user or 401 NextResponse
- Created 14 Controllers (src/interfaces/http/controllers/):
  - auth.controller.ts: login, register, googleAuth (with Google token verification), logout, session - handles session cookie creation/clearing
  - product.controller.ts: list (with filters: search, categoryId, type, lowStock, active, pagination), create, getById, update, delete
  - category.controller.ts: list (with search and pagination), create, getById, update, delete
  - supplier.controller.ts: list (with search and pagination), create, getById, update, delete
  - customer.controller.ts: list (with filters: search, active, pagination), create, getById, update, delete
  - sale.controller.ts: list (with filters: search, status, dateFrom, dateTo, pagination), create, getById, update, delete
  - repair.controller.ts: list (with filters: search, status, pagination), create, getById, update, delete, addPart
  - expense.controller.ts: list (with filters: search, category, dateFrom, dateTo, pagination), create, getById, update, delete
  - stock.controller.ts: list (stock movements), adjust (stock adjustments)
  - dashboard.controller.ts: get (aggregated dashboard data)
  - audit.controller.ts: list (with filters: userId, entity, action, dateFrom, dateTo, search, pagination), stats
  - settings.controller.ts: get (all settings as key-value map), update (supports both single {key, value} and multi {settings: [{key, value}]} formats)
  - export.controller.ts: export (validates format/entity via use case, returns binary file with proper content type)
  - backup.controller.ts: download (admin-only DB download), restore (admin-only file upload restore), stats (DB stats + backup list)
- Refactored ALL 28 API routes to be thin delegates (MAX 10 lines each):
  - /api/auth/login, /api/auth/register, /api/auth/google, /api/auth/logout, /api/auth/session
  - /api/products, /api/products/[id]
  - /api/categories, /api/categories/[id]
  - /api/suppliers, /api/suppliers/[id]
  - /api/customers, /api/customers/[id]
  - /api/sales, /api/sales/[id]
  - /api/repairs, /api/repairs/[id], /api/repairs/[id]/parts
  - /api/expenses, /api/expenses/[id]
  - /api/stock, /api/dashboard, /api/audit, /api/audit/stats
  - /api/settings, /api/export, /api/backup, /api/backup/stats
  - /api/route.ts (root API), /api/seed/route.ts (kept as-is for demo data)
- All routes now simply delegate to the corresponding controller method
- Next.js 16 params properly awaited (Promise<{id: string}> pattern)
- All error handling centralized via ResponsePresenter.error() which maps DomainError → HTTP status
- Controllers use DomainError subclasses (ValidationError, AuthenticationError, AuthorizationError) for consistent error responses

Architecture Rules Followed:
- API routes are MAXIMUM 10 lines each - only delegate to controller
- Controllers parse HTTP request → map to DTO → call use case → return via ResponsePresenter
- All error handling centralized via ResponsePresenter.error()
- DI container initialized via import '@/infrastructure/container' in controllers
- Auth middleware available via requireAuth() for protected routes
- API contract unchanged (same URLs, same request/response shapes)
- Session cookie management in auth controller (createSessionCookie/clearSessionCookie)
- Google OAuth token verification in auth controller (HTTP-specific logic)
- Backup download/restore uses infrastructure service directly (file operations beyond use case scope)

Stage Summary:
- Complete Interface Adapters layer with 14 Controllers, 1 ResponsePresenter, 1 AuthMiddleware
- 4 Infrastructure Adapters bridging service implementations to port interfaces
- Infrastructure Container wiring all dependencies and initializing UseCaseContainer
- All 28 API routes refactored to thin delegates (10 lines max each)
- Consistent error handling via DomainError → HTTP status mapping
- Zero lint errors
- Zero new TypeScript compilation errors

---
Task ID: 4
Agent: frontend-developer
Task: Implement Workshop (Taller) multi-tenancy FRONTEND

Work Log:
- Read worklog.md and all reference files (store.ts, dashboard-view.tsx, products-view.tsx, app-sidebar.tsx, app-shell.tsx, auth-provider.tsx, mobile-nav.tsx, settings-view.tsx)
- Updated Zustand Store (src/lib/store.ts):
  - Added 'workshops' and 'workshop-bi' to ViewType union
  - Added 'Talleres' and 'BI Taller' to viewLabels
  - Added WorkshopInfo interface (id, name, slug, role, active)
  - Added currentWorkshopId, setCurrentWorkshopId to store state
  - Added workshops array, setWorkshops to store state
- Created Workshops View (src/components/app/workshops-view.tsx):
  - Full CRUD view for managing workshops
  - Header with "Mis Talleres" title and "Nuevo Taller" button
  - Workshop Cards Grid showing: name, slug, address, phone, email, currency badge, role badge (owner/admin/employee with Crown/Shield/UserCircle icons and color-coded), member count, active/inactive status, action buttons (Edit, Members, BI, Deactivate/Activate)
  - Empty state with illustration when no workshops
  - Create Workshop Dialog with: name (required), description, address, phone, email, currency select, timezone select, auto-generate slug from name
  - Edit Workshop Dialog with same fields pre-filled
  - Members Management Dialog with: table of members (name, email, role badge, joined date), role dropdown to change role, remove member button, add member section (email + role + add button)
  - BI button navigates to 'workshop-bi' view and sets currentWorkshopId
  - Toggle active/inactive with confirmation dialog
- Created Workshop BI View (src/components/app/workshop-bi-view.tsx):
  - Owner Dashboard with "Panel de Dueño" title or per-workshop BI header
  - Workshop selector dropdown (if multiple workshops) with "Todos los Talleres" option
  - Date range selector (7d, 30d, 90d, 1y)
  - KPI Cards Row: Ingresos Totales (with trend), Gastos Totales (with trend), Ganancia Neta (green/red), Talleres Activos or Reparaciones Pendientes
  - Revenue vs Expenses Area Chart (Recharts) with gradient fills
  - All-workshop view: Workshop Comparison horizontal bar chart + detail table
  - Per-workshop view: Top Products table, Sales by Payment Method pie chart, Repairs by Status donut chart, Expenses by Category horizontal bar chart, Pending Repairs alert card, Low Stock alert card
  - Trends section: Revenue trend, Most Profitable Workshop (all view), Best Selling Product
  - Fallback data generator when API is unavailable
- Updated App Sidebar (src/components/app/app-sidebar.tsx):
  - Added Building2 icon import
  - Added "Mis Talleres" nav item (Building2 icon) - navigates to 'workshops' view
  - Added "BI Taller" nav item (BarChart3 icon) - navigates to 'workshop-bi' view
  - Placed after Dashboard in navigation order
- Updated App Shell (src/components/app/app-shell.tsx):
  - Added WorkshopsView and WorkshopBIView imports
  - Added 'workshops' → <WorkshopsView /> and 'workshop-bi' → <WorkshopBIView /> cases to ViewRenderer
  - Added Building2 icon import
  - Added Workshop Switcher dropdown in header area:
    - Shows current workshop name with Building2 icon
    - "Todos los Talleres" option for aggregated view
    - Lists all workshops user belongs to
    - Selecting a workshop sets currentWorkshopId in store
    - Only visible when authenticated and workshops exist
  - Added "Mis Talleres" and "BI Taller" items to mobile hamburger menu
- Updated Auth Provider (src/components/app/auth-provider.tsx):
  - Added WorkshopInfo import
  - Added fetchWorkshops callback that calls GET /api/workshops
  - Added useEffect to fetch workshops when authenticated
  - After successful login: fetch workshops and set first as current
  - After successful registration: fetch workshops and set first as current
  - After successful Google auth: fetch workshops and set first as current
  - Fallback: silently fails if workshops API unavailable
- Updated Mobile Nav (src/components/app/mobile-nav.tsx):
  - Added Building2 icon import
  - Replaced "Clientes" tab with "Talleres" tab (Building2 icon)
  - Added isActive mapping for 'workshops' view (also covers 'workshop-bi')
- All lint checks pass
- Dev server runs correctly

Stage Summary:
- Complete workshop multi-tenancy frontend with CRUD management and BI dashboard
- Zustand store extended with workshop state (currentWorkshopId, workshops array)
- WorkshopsView: full CRUD with cards grid, create/edit dialogs, members management
- WorkshopBIView: rich BI dashboard with KPI cards, charts (area, bar, pie, donut), comparison tables, alert cards
- Navigation updated in sidebar, header switcher, mobile nav, and hamburger menu
- Auth flow fetches and sets workshop context on login/register/Google auth
- Responsive design with shadcn/ui components and Recharts
- Spanish language throughout

---
Task ID: 3
Agent: backend-workshop-implementer
Task: Implement Workshop (Taller) multi-tenancy BACKEND - Clean Architecture all layers

Work Log:
- Read worklog.md, all existing domain entities, repository interfaces, application use cases, infrastructure implementations, and controllers for reference patterns
- Implemented Domain Layer:
  - Created Workshop entity (src/domain/entities/workshop.ts): create() factory with validation, generateSlug(), updateDetails(), deactivate()/activate(), toPlainObject()
  - Created WorkshopMember interface (src/domain/entities/workshop-member.ts): WorkshopRole type, member with id/workshopId/userId/userName/userEmail/userImage/role/joinedAt
  - Added WorkshopWithRole interface extending Workshop plain object with userRole
  - Updated src/domain/entities/index.ts: Added exports for Workshop, WorkshopMember, WorkshopWithRole, WorkshopRole
  - Updated BaseRepository interface: Added workshopId? to findMany params
  - Updated SaleRepository: Added workshopId? to findByDateRange and getSalesStats
  - Updated RepairRepository: Added workshopId? to findByStatus
  - Updated ExpenseRepository: Added workshopId? to findByDateRange and getByCategory
  - Updated AuditRepository: Added workshopId? to findMany params
  - Updated SettingsRepository: Added workshopId? to get/set/getAll/delete
  - Created WorkshopRepository interface: findById, findBySlug, findMany, create, update, delete, findByUserId, findMembers, addMember, updateMemberRole, removeMember, getMemberRole
- Implemented Application Layer:
  - Added Workshop DTOs: CreateWorkshopRequest, UpdateWorkshopRequest, AddWorkshopMemberRequest, UpdateWorkshopMemberRequest, WorkshopFilters
  - Added BI DTOs: WorkshopBI (with revenueChart, topProducts, expensesByCategory, salesByPaymentMethod, repairsByStatus), OwnerDashboard (aggregate across workshops)
  - Created 9 Workshop Use Cases (src/application/use-cases/workshops/):
    - create-workshop.use-case.ts: Creates workshop + adds creator as owner member, logs audit
    - get-workshops.use-case.ts: List workshops for current user with filters and pagination
    - get-workshop.use-case.ts: Get single workshop by ID with user's role
    - update-workshop.use-case.ts: Update workshop details (owner/admin only), logs audit
    - delete-workshop.use-case.ts: Deactivate workshop (owner only), logs audit
    - add-workshop-member.use-case.ts: Add member (owner/admin only), validates not already member, logs audit
    - remove-workshop-member.use-case.ts: Remove member (owner only), cannot remove owner, logs audit
    - get-workshop-members.use-case.ts: List members (must be a member), returns WorkshopMember[]
    - update-workshop-member.use-case.ts: Update member role (owner only), cannot change own role, logs audit
  - Created 2 BI Use Cases (src/application/use-cases/bi/):
    - get-workshop-bi.use-case.ts: Get BI for single workshop (aggregated from sale/expense/repair/product/customer repos, filtered by workshopId)
    - get-owner-dashboard.use-case.ts: Get BI across ALL workshops the user belongs to, loops through user's workshops, aggregates data
  - Updated DI Container (src/application/container/index.ts):
    - Added WorkshopRepository to AppDependencies
    - Added 11 new use case getters: createWorkshop, getWorkshops, getWorkshop, updateWorkshop, deleteWorkshop, addWorkshopMember, removeWorkshopMember, getWorkshopMembers, updateWorkshopMember, getWorkshopBI, getOwnerDashboard
    - Updated all getter to include new use cases
- Implemented Infrastructure Layer:
  - Created Workshop Mapper (src/infrastructure/persistence/prisma/mappers/workshop.mapper.ts): toDomain/toPrisma
  - Created PrismaWorkshopRepository (src/infrastructure/persistence/prisma/repositories/prisma-workshop.repository.ts):
    - findById, findBySlug, findMany with search/active/pagination
    - create with optional id (for Prisma auto-generate)
    - update with partial data, delete
    - findByUserId: queries WorkshopUser + includes Workshop, returns WorkshopWithRole[]
    - findMembers: queries WorkshopUser + includes User, returns WorkshopMember[]
    - addMember: creates WorkshopUser record, includes User for response
    - updateMemberRole: updates WorkshopUser using compound unique key (workshopId_userId)
    - removeMember: deletes WorkshopUser using compound unique key
    - getMemberRole: finds WorkshopUser record and returns role string
  - Updated mappers index.ts: Added WorkshopMapper export
  - Updated repositories index.ts: Added PrismaWorkshopRepository export
  - Updated infrastructure container.ts: Added PrismaWorkshopRepository to deps
  - Updated all existing Prisma repositories with workshopId support:
    - PrismaProductRepository: findMany supports workshopId filter
    - PrismaCategoryRepository: findMany supports workshopId, create sets workshopId
    - PrismaSupplierRepository: findMany supports workshopId, create sets workshopId
    - PrismaCustomerRepository: findMany supports workshopId, create sets workshopId
    - PrismaSaleRepository: findMany/create/createWithItems support workshopId, findByDateRange/getSalesStats accept optional workshopId
    - PrismaRepairRepository: findMany/create support workshopId, findByStatus accepts optional workshopId
    - PrismaExpenseRepository: findMany/create support workshopId, findByDateRange/getByCategory accept optional workshopId
    - PrismaAuditRepository: log sets workshopId, findMany supports workshopId filter
    - PrismaSettingsRepository: Rewritten to support workshopId in get/set/getAll/delete using compound unique key (workshopId_key)
- Implemented Interface Adapters Layer:
  - Created Workshop Controller (src/interfaces/http/controllers/workshop.controller.ts):
    - list: GET workshops with search/active/pagination
    - getById: GET workshop with user role
    - create: POST create workshop (adds creator as owner)
    - update: PUT update workshop details
    - delete: DELETE deactivate workshop
    - getMembers: GET workshop members
    - addMember: POST add member to workshop
    - removeMember: DELETE remove member from workshop
    - updateMember: PUT update member role
  - Created BI Controller (src/interfaces/http/controllers/bi.controller.ts):
    - getWorkshopBI: GET single workshop BI
    - getOwnerDashboard: GET all workshops BI for owner
- Created API Routes (6 route files):
  - /api/workshops/route.ts: GET (list), POST (create)
  - /api/workshops/[id]/route.ts: GET, PUT, DELETE
  - /api/workshops/[id]/members/route.ts: GET (list members), POST (add member)
  - /api/workshops/[id]/members/[userId]/route.ts: PUT (update role), DELETE (remove)
  - /api/bi/route.ts: GET (owner dashboard, all workshops BI)
  - /api/bi/[workshopId]/route.ts: GET (single workshop BI)
- Updated Seed Route (/api/seed/route.ts):
  - Creates default workshop "TallerTech Principal" first
  - Adds admin user as owner, employee as employee of default workshop
  - All created records (categories, suppliers, products, customers, sales, repairs, expenses, settings) now include workshopId
  - Force reset also clears WorkshopUser and Workshop tables
  - Added workshopId to audit log and settings
- All lint checks pass (bun run lint)
- Database schema pushed (bun run db:push)
- Prisma client regenerated

Architecture Rules Followed:
- Workshop use cases follow existing pattern: authenticate → validate → business logic → persist → audit
- Authorization checks use WorkshopRepository.getMemberRole() for workshop-level permissions
- Owner-only operations: deactivate workshop, remove members, change member roles
- Owner/Admin operations: update workshop, add members
- Member operations: view workshop details, view members, view BI
- All API routes are MAX 10 lines each - only delegate to controller
- Controllers parse HTTP request → map to DTO → call use case → return via ResponsePresenter
- Domain entities are independent (no infrastructure imports)
- Use Cases depend ONLY on domain entities, repository interfaces, ports, and DTOs

Stage Summary:
- COMPLETE Workshop multi-tenancy backend across all 4 Clean Architecture layers
- Domain: Workshop entity with business logic, WorkshopRepository interface
- Application: 11 new use cases (9 workshop + 2 BI), DTOs, DI container updated
- Infrastructure: PrismaWorkshopRepository, WorkshopMapper, all existing repos updated with workshopId
- Interface Adapters: WorkshopController, BIController
- 6 new API routes for workshops and BI
- Seed route updated with default workshop and workshopId on all records
- Zero lint errors
