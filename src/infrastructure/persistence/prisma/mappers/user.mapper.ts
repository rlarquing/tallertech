// ============================================================
// User Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { User } from '@/domain/entities'

export class UserMapper {
  /**
   * Convert a Prisma User record to a Domain User entity
   */
  static toDomain(prismaUser: {
    id: string
    email: string
    name: string
    password: string
    role: string
    active: boolean
    image: string | null
    provider: string
    createdAt: Date
    updatedAt: Date
  }): User {
    return User.create({
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      password: prismaUser.password,
      role: prismaUser.role as 'admin' | 'employee',
      image: prismaUser.image,
      provider: prismaUser.provider as 'credentials' | 'google',
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    })
  }

  /**
   * Convert a Domain User entity to a Prisma-compatible data object
   */
  static toPrisma(user: User): {
    id: string
    email: string
    name: string
    password: string
    role: string
    active: boolean
    image: string | null
    provider: string
    createdAt: Date
    updatedAt: Date
  } {
    const plain = user.toPlainObject()
    return {
      id: plain.id,
      email: plain.email,
      name: plain.name,
      password: user.password,
      role: plain.role,
      active: plain.active,
      image: plain.image ?? null,
      provider: plain.provider,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
