// ============================================================
// Customer Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Customer } from '@/domain/entities'

export class CustomerMapper {
  /**
   * Convert a Prisma Customer record to a Domain Customer entity
   */
  static toDomain(prismaCustomer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    dni: string | null
    notes: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  }): Customer {
    return Customer.create({
      id: prismaCustomer.id,
      name: prismaCustomer.name,
      phone: prismaCustomer.phone,
      email: prismaCustomer.email,
      address: prismaCustomer.address,
      dni: prismaCustomer.dni,
      notes: prismaCustomer.notes,
      active: prismaCustomer.active,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    })
  }

  /**
   * Convert a Domain Customer entity to a Prisma-compatible data object
   */
  static toPrisma(customer: Customer): {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    dni: string | null
    notes: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  } {
    const plain = customer.toPlainObject()
    return {
      id: plain.id,
      name: plain.name,
      phone: plain.phone,
      email: plain.email,
      address: plain.address,
      dni: plain.dni,
      notes: plain.notes,
      active: plain.active,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
