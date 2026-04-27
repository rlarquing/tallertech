// ============================================================
// Prisma Client Singleton with Turso/libSQL Support
// Clean Architecture: Infrastructure Layer - Persistence
//
// Prisma 7 always requires an adapter. We use @prisma/adapter-libsql
// for both local SQLite and remote Turso connections.
//
// Supports two modes:
// 1. Local SQLite: DATABASE_URL=file:./path/to/db (no auth token)
// 2. Turso (libSQL): DATABASE_URL=libsql://... + DATABASE_AUTH_TOKEN
// ============================================================

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.DATABASE_AUTH_TOKEN
  const isLocal = databaseUrl.startsWith('file:')

  // PrismaLibSql takes a Config object (same as @libsql/client createClient)
  // It creates its own internal libsql client
  const adapter = new PrismaLibSql({
    url: databaseUrl,
    authToken: isLocal ? undefined : (authToken || undefined),
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
