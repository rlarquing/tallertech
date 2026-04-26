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
    provider?: string
    image?: string
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || 'admin',
        provider: data.provider || 'credentials',
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

  async findOrCreateGoogleUser(data: {
    email: string
    name: string
    image?: string
  }): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) return UserMapper.toDomain(existing)

    // Create new Google user WITH a default workshop in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image || null,
          provider: 'google',
          password: '',
          role: 'owner',
        },
      })

      // 2. Create a default workshop for the new user
      const slugBase = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20)

      const slug = `${slugBase}-${Date.now().toString(36)}`

      const workshop = await tx.workshop.create({
        data: {
          name: `Taller de ${data.name}`,
          slug,
          description: 'Taller creado automáticamente con cuenta de Google',
          currency: 'USD',
          timezone: 'America/Havana',
        },
      })

      // 3. Link user as owner of the workshop
      await tx.workshopUser.create({
        data: {
          workshopId: workshop.id,
          userId: user.id,
          role: 'owner',
        },
      })

      // 4. Create default categories for the workshop
      const defaultCategories = [
        { name: 'Pantallas', description: 'Pantallas y displays', type: 'part' },
        { name: 'Baterías', description: 'Baterías de reemplazo', type: 'part' },
        { name: 'Cables y Conectores', description: 'Cables flex, conectores de carga', type: 'part' },
        { name: 'Carcasas', description: 'Carcasas y marcos', type: 'part' },
        { name: 'Cámaras', description: 'Módulos de cámara', type: 'part' },
        { name: 'Accesorios', description: 'Fundas, protectores, cargadores', type: 'product' },
        { name: 'Servicios', description: 'Servicios de reparación', type: 'service' },
        { name: 'Herramientas', description: 'Herramientas de reparación', type: 'product' },
      ]

      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            workshopId: workshop.id,
            ...cat,
          },
        })
      }

      // 5. Create default settings for the workshop
      const defaultSettings = [
        { key: 'shop_name', value: `Taller de ${data.name}` },
        { key: 'shop_email', value: data.email },
        { key: 'currency', value: 'USD' },
        { key: 'tax_rate', value: '0' },
        { key: 'receipt_footer', value: 'Gracias por su compra!' },
      ]

      for (const setting of defaultSettings) {
        await tx.setting.create({
          data: {
            workshopId: workshop.id,
            key: setting.key,
            value: setting.value,
          },
        })
      }

      return user
    })

    return UserMapper.toDomain(result)
  }
}
