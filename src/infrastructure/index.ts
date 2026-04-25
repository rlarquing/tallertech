// ============================================================
// Infrastructure Layer Index
// Clean Architecture: Infrastructure Layer
// ============================================================

// ─── Persistence ─────────────────────────────────────────────────
export { prisma } from './persistence/prisma/prisma-client'
export * from './persistence/prisma/mappers'
export * from './persistence/prisma/repositories'
export * from './persistence/offline'

// ─── Auth ────────────────────────────────────────────────────────
export * from './auth'

// ─── Services ────────────────────────────────────────────────────
export * from './services'

// ─── HTTP ────────────────────────────────────────────────────────
export * from './http'
