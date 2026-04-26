// ============================================================
// Prisma Client Singleton with Turso/libSQL Support
// Clean Architecture: Infrastructure Layer - Persistence
//
// Supports two modes:
// 1. Local SQLite: DATABASE_URL=file:./path/to/db (no Turso vars)
// 2. Turso (libSQL): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN set
// ============================================================

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

  // If Turso credentials are provided, use the libSQL adapter
  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    })

    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Fallback: local SQLite (for development)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
