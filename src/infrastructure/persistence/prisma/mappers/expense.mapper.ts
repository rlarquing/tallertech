// ============================================================
// Expense Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Expense } from '@/domain/entities'

export class ExpenseMapper {
  /**
   * Convert a Prisma Expense record to a Domain Expense entity
   */
  static toDomain(prismaExpense: {
    id: string
    category: string
    description: string
    amount: number
    userId: string
    userName: string
    date: Date
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }): Expense {
    return Expense.create({
      id: prismaExpense.id,
      category: prismaExpense.category as 'supplies' | 'rent' | 'salary' | 'utilities' | 'other',
      description: prismaExpense.description,
      amount: prismaExpense.amount,
      userId: prismaExpense.userId,
      userName: prismaExpense.userName,
      date: prismaExpense.date,
      notes: prismaExpense.notes,
      createdAt: prismaExpense.createdAt,
      updatedAt: prismaExpense.updatedAt,
    })
  }

  /**
   * Convert a Domain Expense entity to a Prisma-compatible data object
   */
  static toPrisma(expense: Expense): {
    id: string
    category: string
    description: string
    amount: number
    userId: string
    userName: string
    date: Date
    notes: string | null
    createdAt: Date
    updatedAt: Date
  } {
    const plain = expense.toPlainObject()
    return {
      id: plain.id,
      category: plain.category,
      description: plain.description,
      amount: plain.amount,
      userId: plain.userId,
      userName: plain.userName,
      date: plain.date,
      notes: plain.notes,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    }
  }
}
