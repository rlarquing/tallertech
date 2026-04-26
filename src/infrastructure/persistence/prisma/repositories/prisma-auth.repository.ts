// ============================================================
// PrismaAuthRepository - AuthRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { AuthRepository } from '@/domain/repositories'
import { User } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { UserMapper } from '../mappers'

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    return user ? UserMapper.toDomain(user) : null
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    return user ? UserMapper.toDomain(user) : null
  }

  async create(data: {
    email: string
    name: string
    password: string
    role?: string
    image?: string
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || 'admin',
        image: data.image || null,
      },
    })
    return UserMapper.toDomain(user)
  }

  async updatePassword(id: string, password: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password },
    })
  }
}
