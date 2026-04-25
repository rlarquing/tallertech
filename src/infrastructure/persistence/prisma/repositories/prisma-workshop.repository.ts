// ============================================================
// PrismaWorkshopRepository - WorkshopRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { WorkshopRepository } from '@/domain/repositories'
import { Workshop, WorkshopMember, WorkshopWithRole } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { WorkshopMapper } from '../mappers'

export class PrismaWorkshopRepository implements WorkshopRepository {
  async findById(id: string): Promise<Workshop | null> {
    const workshop = await prisma.workshop.findUnique({ where: { id } })
    return workshop ? WorkshopMapper.toDomain(workshop) : null
  }

  async findBySlug(slug: string): Promise<Workshop | null> {
    const workshop = await prisma.workshop.findUnique({ where: { slug } })
    return workshop ? WorkshopMapper.toDomain(workshop) : null
  }

  async findMany(params: {
    search?: string
    active?: boolean
    skip?: number
    take?: number
  }): Promise<{ data: Workshop[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { slug: { contains: params.search } },
      ]
    }

    if (params.active !== undefined) {
      where.active = params.active
    }

    const skip = params.skip || 0
    const take = params.take || 20

    const [data, total] = await Promise.all([
      prisma.workshop.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.workshop.count({ where }),
    ])

    return {
      data: data.map((w) => WorkshopMapper.toDomain(w)),
      total,
    }
  }

  async create(
    data: Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Workshop> {
    const plain = data.toPlainObject ? data.toPlainObject() : data
    const createData: Record<string, unknown> = {
      name: plain.name,
      slug: plain.slug,
      description: plain.description,
      address: plain.address,
      phone: plain.phone,
      email: plain.email,
      logo: plain.logo,
      active: plain.active,
      currency: plain.currency,
      timezone: plain.timezone,
      settings: plain.settings,
    }
    if (plain.id) createData.id = plain.id

    const workshop = await prisma.workshop.create({
      data: createData as Parameters<typeof prisma.workshop.create>[0]['data'],
    })
    return WorkshopMapper.toDomain(workshop)
  }

  async update(id: string, data: Partial<Workshop>): Promise<Workshop> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.address !== undefined) updateData.address = data.address
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.logo !== undefined) updateData.logo = data.logo
    if (data.active !== undefined) updateData.active = data.active
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.timezone !== undefined) updateData.timezone = data.timezone

    const workshop = await prisma.workshop.update({
      where: { id },
      data: updateData,
    })
    return WorkshopMapper.toDomain(workshop)
  }

  async delete(id: string): Promise<void> {
    await prisma.workshop.delete({ where: { id } })
  }

  async findByUserId(userId: string): Promise<WorkshopWithRole[]> {
    const memberships = await prisma.workshopUser.findMany({
      where: { userId },
      include: {
        workshop: true,
      },
    })

    return memberships.map((m) => ({
      ...WorkshopMapper.toDomain(m.workshop).toPlainObject(),
      userRole: m.role as 'owner' | 'admin' | 'employee',
    }))
  }

  async findMembers(workshopId: string): Promise<WorkshopMember[]> {
    const memberships = await prisma.workshopUser.findMany({
      where: { workshopId },
      include: {
        user: true,
      },
    })

    return memberships.map((m) => ({
      id: m.id,
      workshopId: m.workshopId,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      userImage: m.user.image,
      role: m.role as 'owner' | 'admin' | 'employee',
      joinedAt: m.joinedAt,
    }))
  }

  async addMember(
    workshopId: string,
    userId: string,
    role: string,
  ): Promise<WorkshopMember> {
    const membership = await prisma.workshopUser.create({
      data: {
        workshopId,
        userId,
        role,
      },
      include: {
        user: true,
      },
    })

    return {
      id: membership.id,
      workshopId: membership.workshopId,
      userId: membership.userId,
      userName: membership.user.name,
      userEmail: membership.user.email,
      userImage: membership.user.image,
      role: membership.role as 'owner' | 'admin' | 'employee',
      joinedAt: membership.joinedAt,
    }
  }

  async updateMemberRole(
    workshopId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await prisma.workshopUser.update({
      where: {
        workshopId_userId: { workshopId, userId },
      },
      data: { role },
    })
  }

  async removeMember(workshopId: string, userId: string): Promise<void> {
    await prisma.workshopUser.delete({
      where: {
        workshopId_userId: { workshopId, userId },
      },
    })
  }

  async getMemberRole(workshopId: string, userId: string): Promise<string | null> {
    const membership = await prisma.workshopUser.findUnique({
      where: {
        workshopId_userId: { workshopId, userId },
      },
    })
    return membership ? membership.role : null
  }
}
