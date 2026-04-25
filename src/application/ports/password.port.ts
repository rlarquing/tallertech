// ============================================================
// Password Port - Interface for password hashing/verification
// Clean Architecture: Application Business Rules Layer
// ============================================================

export interface PasswordPort {
  hash(password: string): string
  verify(password: string, hash: string): boolean
}
