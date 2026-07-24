// ============================================================
// Prisma Config - Required for Prisma 7 CLI commands
// Configures the database connection for prisma db push, migrate, etc.
//
// In production (Vercel + Turso):
//   DATABASE_URL=libsql://your-db.turso.io
//   DATABASE_AUTH_TOKEN=your-token
//
// In local development:
//   DATABASE_URL=file:./db/custom.db
// ============================================================

import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// `earlyAccess` and `migrations.adapter` are early-access Prisma 7 features
// not yet present in the stable @prisma/config type definitions. They work at
// runtime, so we cast the config to suppress the TS error while keeping the
// runtime behaviour intact.
export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'file:./db/custom.db',
  },
  migrations: {
    adapter: async () => {
      const url = process.env.DATABASE_URL || 'file:./db/custom.db'
      const isLocal = url.startsWith('file:')

      return new PrismaLibSql({
        url,
        authToken: isLocal ? undefined : process.env.DATABASE_AUTH_TOKEN,
      })
    },
  },
} as Parameters<typeof defineConfig>[0])
