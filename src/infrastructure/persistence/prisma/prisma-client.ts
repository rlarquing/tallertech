// ============================================================
// Prisma Client Singleton - Turso/libSQL Driver Adapter
// Clean Architecture: Infrastructure Layer - Persistence
// Supports both local SQLite (dev) and Turso cloud (production)
// In Prisma 7, a driver adapter is required for all connections
// ============================================================

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  // Turso cloud database (libsql:// protocol)
  if (databaseUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
      intMode: 'bigint',
    })
    return new PrismaClient({ adapter })
  }

  // Local SQLite file (file: protocol)
  // Prisma 7 requires a driver adapter - use libsql for local files too
  const filePath = databaseUrl.startsWith('file:')
    ? databaseUrl.slice(5) // Remove 'file:' prefix
    : databaseUrl

  const adapter = new PrismaLibSql({
    url: `file:${filePath}`,
    intMode: 'bigint',
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
