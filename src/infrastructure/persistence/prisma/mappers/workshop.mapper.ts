// ============================================================
// Workshop Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Workshop } from '@/domain/entities'

export class WorkshopMapper {
  /**
   * Convert a Prisma Workshop record to a Domain Workshop entity
   */
  static toDomain(prismaWorkshop: {
    id: string
    name: string
    slug: string
    description: string | null
    address: string | null
    phone: string | null
    email: string | null
    logo: string | null
    active: boolean
    currency: string
    timezone: string
    settings: string
    createdAt: Date
    updatedAt: Date
  }): Workshop {
    return Workshop.create({
      id: prismaWorkshop.id,
      name: prismaWorkshop.name,
      slug: prismaWorkshop.slug,
      description: prismaWorkshop.description,
      address: prismaWorkshop.address,
      phone: prismaWorkshop.phone,
      email: prismaWorkshop.email,
      logo: prismaWorkshop.logo,
      active: prismaWorkshop.active,
      currency: prismaWorkshop.currency,
      timezone: prismaWorkshop.timezone,
      settings: prismaWorkshop.settings,
      createdAt: prismaWorkshop.createdAt,
      updatedAt: prismaWorkshop.updatedAt,
    })
  }

  /**
   * Convert a Domain Workshop entity to a Prisma-compatible data object
   */
  static toPrisma(workshop: Workshop): {
    id: string
    name: string
    slug: string
    description: string | null
    address: string | null
    phone: string | null
    email: string | null
    logo: string | null
    active: boolean
    currency: string
    timezone: string
    settings: string
    createdAt: Date
    updatedAt: Date
  } {
    const plain = workshop.toPlainObject()
    return {
      id: plain.id,
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
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
