// ============================================================
// toPlain - Safe extraction of plain data from entities or plain objects
// Clean Architecture: Infrastructure Layer - Persistence Helper
// ============================================================
//
// Use cases often build plain object literals and cast them to
// `Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>` to satisfy the
// repository interface. Some repositories then call `data.toPlainObject()`,
// which only exists on entity instances, causing a runtime
// `TypeError: data.toPlainObject is not a function` (HTTP 500).
//
// This helper accepts either an entity instance (with `toPlainObject`)
// or a plain object literal, and always returns a plain record.

/**
 * Extract a plain object from either a domain entity (which exposes
 * `toPlainObject()`) or a plain object literal.
 */
export function toPlain(data: unknown): Record<string, unknown> {
  if (
    data &&
    typeof data === 'object' &&
    typeof (data as { toPlainObject?: unknown }).toPlainObject === 'function'
  ) {
    return (data as { toPlainObject: () => Record<string, unknown> }).toPlainObject()
  }
  return data as Record<string, unknown>
}
