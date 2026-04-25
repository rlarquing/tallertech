// ============================================================
// Supplier Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Supplier } from '@/domain/entities'

export class SupplierMapper {
  /**
   * Convert a Prisma Supplier record to a Domain Supplier entity
   */
  static toDomain(prismaSupplier: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  }): Supplier {
    return Supplier.create({
      id: prismaSupplier.id,
      name: prismaSupplier.name,
      phone: prismaSupplier.phone,
      email: prismaSupplier.email,
      address: prismaSupplier.address,
      notes: prismaSupplier.notes,
      active: prismaSupplier.active,
      createdAt: prismaSupplier.createdAt,
      updatedAt: prismaSupplier.updatedAt,
    })
  }

  /**
   * Convert a Domain Supplier entity to a Prisma-compatible data object
   */
  static toPrisma(supplier: Supplier): {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    active: boolean
    createdAt: Date
    updatedAt: Date
  } {
    const plain = supplier.toPlainObject()
    return {
      id: plain.id,
      name: plain.name,
      phone: plain.phone,
      email: plain.email,
      address: plain.address,
      notes: plain.notes,
      active: plain.active,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
