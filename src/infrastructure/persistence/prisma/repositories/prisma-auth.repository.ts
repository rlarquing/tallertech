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

  async update(id: string, data: { name?: string; email?: string; password?: string; active?: boolean }): Promise<User> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.password !== undefined) updateData.password = data.password
    if (data.active !== undefined) updateData.active = data.active

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
