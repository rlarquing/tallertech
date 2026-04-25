// ============================================================
// Database Client - Re-export from infrastructure layer
// This file exists for backward compatibility with seed route
// ============================================================

export { prisma as db } from '@/infrastructure/persistence/prisma/prisma-client'
