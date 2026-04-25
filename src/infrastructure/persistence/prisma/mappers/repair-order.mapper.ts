// ============================================================
// RepairOrder Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { RepairOrder, RepairPart } from '@/domain/entities'
import { RepairPartMapper } from './repair-part.mapper'

export class RepairOrderMapper {
  /**
   * Convert a Prisma RepairOrder record to a Domain RepairOrder entity
   * Supports both with and without included parts/customer
   */
  static toDomain(prismaRepair: {
    id: string
    code: string
    customerId: string
    userId: string
    userName: string
    device: string
    brand: string | null
    imei: string | null
    issue: string
    diagnosis: string | null
    solution: string | null
    status: string
    priority: string
    costEstimate: number
    laborCost: number
    partsCost: number
    totalCost: number
    paymentMethod: string
    paid: boolean
    receivedAt: Date
    estimatedReady: Date | null
    completedAt: Date | null
    deliveredAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    parts?: Array<{
      id: string
      repairOrderId: string
      productId: string | null
      name: string
      quantity: number
      unitPrice: number
      total: number
    }>
    customer?: { name: string } | null
  }): RepairOrder {
    const parts: RepairPart[] = prismaRepair.parts
      ? prismaRepair.parts.map((part) => RepairPartMapper.toDomain(part))
      : []

    return RepairOrder.create({
      id: prismaRepair.id,
      code: prismaRepair.code,
      customerId: prismaRepair.customerId,
      userId: prismaRepair.userId,
      userName: prismaRepair.userName,
      device: prismaRepair.device,
      brand: prismaRepair.brand,
      imei: prismaRepair.imei,
      issue: prismaRepair.issue,
      diagnosis: prismaRepair.diagnosis,
      solution: prismaRepair.solution,
      status: prismaRepair.status as 'received' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'ready' | 'delivered' | 'cancelled',
      priority: prismaRepair.priority as 'low' | 'normal' | 'high' | 'urgent',
      costEstimate: prismaRepair.costEstimate,
      laborCost: prismaRepair.laborCost,
      partsCost: prismaRepair.partsCost,
      totalCost: prismaRepair.totalCost,
      paymentMethod: prismaRepair.paymentMethod,
      paid: prismaRepair.paid,
      receivedAt: prismaRepair.receivedAt,
      estimatedReady: prismaRepair.estimatedReady,
      completedAt: prismaRepair.completedAt,
      deliveredAt: prismaRepair.deliveredAt,
      notes: prismaRepair.notes,
      createdAt: prismaRepair.createdAt,
      updatedAt: prismaRepair.updatedAt,
      parts,
      customer: prismaRepair.customer ?? null,
    })
  }

  /**
   * Convert a Domain RepairOrder entity to a Prisma-compatible data object (without parts)
   */
  static toPrisma(repair: RepairOrder): {
    id: string
    code: string
    customerId: string
    userId: string
    userName: string
    device: string
    brand: string | null
    imei: string | null
    issue: string
    diagnosis: string | null
    solution: string | null
    status: string
    priority: string
    costEstimate: number
    laborCost: number
    partsCost: number
    totalCost: number
    paymentMethod: string
    paid: boolean
    receivedAt: Date
    estimatedReady: Date | null
    completedAt: Date | null
    deliveredAt: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } {
    const plain = repair.toPlainObject()
    return {
      id: plain.id,
      code: plain.code,
      customerId: plain.customerId,
      userId: plain.userId,
      userName: plain.userName,
      device: plain.device,
      brand: plain.brand,
      imei: plain.imei,
      issue: plain.issue,
      diagnosis: plain.diagnosis,
      solution: plain.solution,
      status: plain.status,
      priority: plain.priority,
      costEstimate: plain.costEstimate,
      laborCost: plain.laborCost,
      partsCost: plain.partsCost,
      totalCost: plain.totalCost,
      paymentMethod: plain.paymentMethod,
      paid: plain.paid,
      receivedAt: plain.receivedAt,
      estimatedReady: plain.estimatedReady,
      completedAt: plain.completedAt,
      deliveredAt: plain.deliveredAt,
      notes: plain.notes,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
