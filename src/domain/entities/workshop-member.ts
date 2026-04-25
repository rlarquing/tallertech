/**
 * WorkshopMember Entity
 * Represents a user's membership in a workshop.
 */

export type WorkshopRole = 'owner' | 'admin' | 'employee'

export interface WorkshopMember {
  id: string
  workshopId: string
  userId: string
  userName: string
  userEmail: string
  userImage: string | null
  role: WorkshopRole
  joinedAt: Date
}
