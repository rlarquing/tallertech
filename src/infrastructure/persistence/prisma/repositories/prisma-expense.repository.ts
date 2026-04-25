// ============================================================
// PrismaExpenseRepository - ExpenseRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { ExpenseRepository } from '@/domain/repositories'
import { Expense } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { ExpenseMapper } from '../mappers'

export class PrismaExpenseRepository implements ExpenseRepository {
  async findById(id: string): Promise<Expense | null> {
    const expense = await prisma.expense.findUnique({ where: { id } })
    return expense ? ExpenseMapper.toDomain(expense) : null
  }

  async findMany(params?: {
    search?: string
    skip?: number
    take?: number
    filters?: Record<string, string>
  }): Promise<{ data: Expense[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (params?.search) {
      where.OR = [
        { description: { contains: params.search } },
        { category: { contains: params.search } },
        { userName: { contains: params.search } },
      ]
    }

    if (params?.filters) {
      if (params.filters.category) {
        where.category = params.filters.category
      }
      if (params.filters.dateFrom || params.filters.dateTo) {
        where.date = {}
        if (params.filters.dateFrom) {
          (where.date as Record<string, unknown>).gte = new Date(params.filters.dateFrom)
        }
        if (params.filters.dateTo) {
          const to = new Date(params.filters.dateTo)
          to.setHours(23, 59, 59, 999)
          ;(where.date as Record<string, unknown>).lte = to
        }
      }
    }

    const skip = params?.skip || 0
    const take = params?.take || 20

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.expense.count({ where }),
    ])

    return {
      data: data.map((e) => ExpenseMapper.toDomain(e)),
      total,
    }
  }

  async create(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const plain = data.toPlainObject()
    const expense = await prisma.expense.create({
      data: {
        category: plain.category,
        description: plain.description,
        amount: plain.amount,
        userId: plain.userId,
        userName: plain.userName,
        date: plain.date,
        notes: plain.notes,
      },
    })
    return ExpenseMapper.toDomain(expense)
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    const updateData: Record<string, unknown> = {}
    if (data.category !== undefined) updateData.category = data.category
    if (data.description !== undefined) updateData.description = data.description
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.date !== undefined) updateData.date = data.date
    if (data.notes !== undefined) updateData.notes = data.notes

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    })
    return ExpenseMapper.toDomain(expense)
  }

  async delete(id: string): Promise<void> {
    await prisma.expense.delete({ where: { id } })
  }

  async findByDateRange(from: Date, to: Date): Promise<Expense[]> {
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'desc' },
    })
    return expenses.map((e) => ExpenseMapper.toDomain(e))
  }

  async getByCategory(
    from?: Date,
    to?: Date
  ): Promise<{ category: string; total: number }[]> {
    const where: Record<string, unknown> = {}
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = from
      if (to) (where.date as Record<string, unknown>).lte = to
    }

    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    })

    return byCategory.map((item) => ({
      category: item.category,
      total: item._sum.amount || 0,
    }))
  }
}
