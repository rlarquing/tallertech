// ============================================================
// Session Port - Interface for session/auth context
// Clean Architecture: Application Business Rules Layer
// ============================================================

export interface SessionPort {
  getSessionUser(request: Request): Promise<{
    id: string
    email: string
    name: string
    role: string
    image?: string | null
  } | null>
}
