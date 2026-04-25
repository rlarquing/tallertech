// ============================================================
// Prisma Config - Required for Prisma 7 CLI commands
// Configures the Turso/libSQL adapter for prisma db push, migrate, etc.
// ============================================================

import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    adapter: async () => {
      return new PrismaLibSql({
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN,
        intMode: 'bigint',
      })
    },
  },
})
