// ============================================================
// Prisma Client Singleton with Turso/libSQL Support
// Clean Architecture: Infrastructure Layer - Persistence
//
// Supports two modes:
// 1. Local SQLite: DATABASE_URL=file:./path/to/db (no auth token)
// 2. Turso (libSQL): DATABASE_URL=libsql://... + DATABASE_AUTH_TOKEN
// ============================================================

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.DATABASE_AUTH_TOKEN

  // If DATABASE_URL points to a libsql/turso remote database, use the adapter
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken || undefined,
    })

    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Fallback: local SQLite file (for development)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
