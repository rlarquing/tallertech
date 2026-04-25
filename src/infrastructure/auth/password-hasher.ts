// ============================================================
// Password Hasher - Implements password hashing and verification
// Clean Architecture: Infrastructure Layer - Auth
// ============================================================

import { createHash } from 'crypto'

const SECRET = 'tallertech-secret-key-2024'

export class PasswordHasher {
  /**
   * Hash a password using SHA-256 with a secret salt
   */
  hash(password: string): string {
    return createHash('sha256').update(password + SECRET).digest('hex')
  }

  /**
   * Verify a password against a stored hash
   */
  verify(password: string, hash: string): boolean {
    return this.hash(password) === hash
  }
}

// Singleton instance for convenience
export const passwordHasher = new PasswordHasher()
