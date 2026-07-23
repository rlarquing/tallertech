// ============================================================
// sync-turso.mjs
// Aplica el schema de Prisma a Turso usando @libsql/client directo.
// Esto evita el bug de Prisma 7 CLI que no reconoce el esquema libsql://
// en datasource.url del prisma.config.ts.
//
// Estrategia: idempotente. Reescribe los CREATE TABLE para que lleven
// IF NOT EXISTS, así se puede correr las veces que sea sin romper.
// ============================================================

import { execSync } from 'node:child_process'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url || !url.startsWith('libsql:')) {
  console.error('DATABASE_URL debe ser una URL libsql:// (Turso)')
  process.exit(1)
}

console.log('[sync] Generando SQL desde prisma/schema.prisma...')
const sql = execSync('bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script', {
  encoding: 'utf8',
  env: { ...process.env },
})

console.log(`[sync] SQL generado: ${sql.length} bytes`)

// Hacer idempotente: agregar IF NOT EXISTS a CREATE TABLE y CREATE INDEX
const idempotentSql = sql
  .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
  .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "')
  .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')

// Split en statements individuales (Prisma separa con ;\n)
const statements = idempotentSql
  .split(/^;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`[sync] ${statements.length} statements a aplicar`)

// Conectar a Turso
const client = createClient({ url, authToken })

let applied = 0
let skipped = 0
let failed = 0

for (const stmt of statements) {
  try {
    await client.execute(stmt)
    applied++
    const preview = stmt.slice(0, 80).replace(/\s+/g, ' ')
    console.log(`[sync] ✓ ${preview}...`)
  } catch (err) {
    const msg = String(err.message || err)
    // Errores comunes y seguros de ignorar
    if (
      msg.includes('already exists') ||
      msg.includes('duplicate column name') ||
      msg.includes('no such table') ||
      msg.includes('UNIQUE constraint failed')
    ) {
      skipped++
      console.log(`[sync] ⊘ ${msg.slice(0, 120)}`)
    } else {
      failed++
      console.error(`[sync] ✗ ${msg.slice(0, 200)}`)
      console.error(`    Statement: ${stmt.slice(0, 150).replace(/\s+/g, ' ')}...`)
    }
  }
}

console.log('')
console.log('[sync] Resumen:')
console.log(`  Aplicados: ${applied}`)
console.log(`  Omitidos (ya existían): ${skipped}`)
console.log(`  Fallidos: ${failed}`)

client.close()

if (failed > 0) {
  console.error('[sync] Hubo errores. Revisar logs arriba.')
  process.exit(1)
}

console.log('[sync] Sincronización completada.')
