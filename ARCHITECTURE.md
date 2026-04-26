# TallerTech — Clean Architecture

## Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│                   FRAMEWORKS & DRIVERS                   │
│  Next.js App Router │ Prisma/SQLite │ IndexedDB │ PDFKit │
│  (API Routes)       │ (DB)          │ (Offline) │ (XLSX) │
├─────────────────────────────────────────────────────────┤
│               INTERFACE ADAPTERS                         │
│  Controllers │ Presenters │ Mappers │ Middlewares         │
├─────────────────────────────────────────────────────────┤
│             APPLICATION BUSINESS RULES                   │
│  Use Cases (Interactors) │ DTOs │ Ports │ DI Container   │
├─────────────────────────────────────────────────────────┤
│             ENTERPRISE BUSINESS RULES                    │
│  Entities (rich) │ Value Objects │ Domain Errors │ Events │
└─────────────────────────────────────────────────────────┘

  ← Dependencias apuntan hacia adentro →
  La capa más interna (Domain) NO depende de nada.
  La capa más externa (Frameworks) depende de todas.
```

## Estructura de Carpetas

```
src/
├── domain/                              # CAPA 1: Enterprise Business Rules
│   ├── entities/                        # Entidades ricas con comportamiento
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── customer.ts
│   │   ├── sale.ts
│   │   ├── sale-item.ts
│   │   ├── repair-order.ts
│   │   ├── repair-part.ts
│   │   ├── category.ts
│   │   ├── supplier.ts
│   │   ├── expense.ts
│   │   ├── stock-movement.ts
│   │   ├── audit-log.ts
│   │   ├── setting.ts
│   │   └── index.ts
│   ├── value-objects/                   # Value Objects inmutables
│   │   ├── money.ts
│   │   ├── email.ts
│   │   ├── repair-status.ts
│   │   ├── sale-status.ts
│   │   └── index.ts
│   ├── repositories/                    # Interfaces de repositorios (contratos)
│   │   └── index.ts
│   ├── errors/                          # Errores de dominio
│   │   └── index.ts
│   └── events/                          # Eventos de dominio
│       └── index.ts
│
├── application/                         # CAPA 2: Application Business Rules
│   ├── use-cases/                       # Casos de uso (Interactors)
│   │   ├── auth/
│   │   │   ├── login.use-case.ts
│   │   │   ├── register.use-case.ts
│   │   │   └── logout.use-case.ts
│   │   ├── products/
│   │   │   ├── create-product.use-case.ts
│   │   │   ├── get-products.use-case.ts
│   │   │   ├── update-product.use-case.ts
│   │   │   └── delete-product.use-case.ts
│   │   ├── sales/
│   │   │   ├── create-sale.use-case.ts
│   │   │   ├── get-sales.use-case.ts
│   │   │   ├── update-sale.use-case.ts
│   │   │   └── delete-sale.use-case.ts
│   │   ├── repairs/
│   │   │   ├── create-repair.use-case.ts
│   │   │   ├── get-repairs.use-case.ts
│   │   │   ├── update-repair.use-case.ts
│   │   │   ├── delete-repair.use-case.ts
│   │   │   ├── update-repair-status.use-case.ts
│   │   │   └── add-repair-part.use-case.ts
│   │   ├── customers/
│   │   ├── categories/
│   │   ├── suppliers/
│   │   ├── expenses/
│   │   ├── stock/
│   │   │   └── adjust-stock.use-case.ts
│   │   ├── dashboard/
│   │   │   └── get-dashboard.use-case.ts
│   │   ├── audit/
│   │   │   ├── get-audit-logs.use-case.ts
│   │   │   └── get-audit-stats.use-case.ts
│   │   ├── settings/
│   │   │   ├── get-settings.use-case.ts
│   │   │   └── update-settings.use-case.ts
│   │   ├── export/
│   │   │   └── export-data.use-case.ts
│   │   └── backup/
│   │       ├── list-backups.use-case.ts
│   │       ├── create-backup.use-case.ts
│   │       └── get-backup-stats.use-case.ts
│   ├── dtos/                            # Data Transfer Objects
│   │   └── index.ts
│   ├── ports/                           # Puertos (interfaces para servicios externos)
│   │   ├── auth.port.ts
│   │   ├── audit.port.ts
│   │   ├── export.port.ts
│   │   ├── backup.port.ts
│   │   └── session.port.ts
│   └── container/                       # Dependency Injection Container
│       └── index.ts
│
├── infrastructure/                      # CAPA 3: Infrastructure
│   ├── persistence/                     # Implementaciones de persistencia
│   │   ├── prisma/
│   │   │   ├── prisma-client.ts         # PrismaClient singleton
│   │   │   ├── mappers/                 # Mappers Domain <-> Prisma
│   │   │   │   ├── user.mapper.ts
│   │   │   │   ├── product.mapper.ts
│   │   │   │   ├── sale.mapper.ts
│   │   │   │   ├── repair.mapper.ts
│   │   │   │   ├── customer.mapper.ts
│   │   │   │   ├── category.mapper.ts
│   │   │   │   ├── supplier.mapper.ts
│   │   │   │   ├── expense.mapper.ts
│   │   │   │   └── index.ts
│   │   │   └── repositories/            # Implementaciones de repositorios
│   │   │       ├── prisma-auth.repository.ts
│   │   │       ├── prisma-product.repository.ts
│   │   │       ├── prisma-sale.repository.ts
│   │   │       ├── prisma-repair.repository.ts
│   │   │       ├── prisma-customer.repository.ts
│   │   │       ├── prisma-category.repository.ts
│   │   │       ├── prisma-supplier.repository.ts
│   │   │       ├── prisma-expense.repository.ts
│   │   │       ├── prisma-audit.repository.ts
│   │   │       ├── prisma-settings.repository.ts
│   │   │       └── index.ts
│   │   └── offline/                     # IndexedDB offline implementation
│   │       └── offline-db.ts
│   ├── auth/                            # Implementaciones de auth
│   │   ├── cookie-session.ts
│   │   └── password-hasher.ts
│   ├── services/                        # Implementaciones de servicios
│   │   ├── audit-service.ts
│   │   ├── export-service.ts
│   │   └── backup-service.ts
│   └── http/                            # HTTP client implementations
│       └── offline-fetch.ts
│
├── interfaces/                          # CAPA 4: Interface Adapters
│   ├── http/
│   │   ├── controllers/                 # Controladores delgados
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── sale.controller.ts
│   │   │   ├── repair.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── supplier.controller.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── stock.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── export.controller.ts
│   │   │   └── backup.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   └── presenters/
│   │       └── response.presenter.ts
│   └── web/                             # React components (existente)
│       └── (se mantienen los componentes actuales)
│
├── app/                                 # Next.js App Router (rutas delgadas)
│   ├── api/
│   │   ├── auth/login/route.ts          # Solo delega al controller
│   │   └── ...                          # Todas las rutas delegan al controller
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                          # React components (UI)
├── hooks/                               # React hooks
├── lib/                                 # Shared utilities
└── types/                               # TypeScript types
```

## Principios Clave

1. **Regla de Dependencia**: Las dependencias apuntan SOLO hacia adentro. Domain no depende de nadie. Infrastructure depende de Domain. Application depende de Domain. Interfaces depende de Application y Domain.

2. **Entidades Ricas**: Las entidades del dominio contienen lógica de negocio (cálculos, validaciones, cambios de estado), no son solo interfaces de datos.

3. **Use Cases**: Cada operación de negocio es un Use Case independiente con una única responsabilidad.

4. **Repository Pattern**: Los repositorios son interfaces en Domain y se implementan en Infrastructure con Prisma.

5. **Dependency Inversion**: Los Use Cases dependen de interfaces (Ports/Repositories), no de implementaciones concretas.

6. **Controllers Delgados**: Los API routes solo parsean la request y delegan al controller, que a su vez delega al use case.

7. **Mappers**: Convierten entre modelos de Prisma y entidades de dominio, manteniendo las capas separadas.
