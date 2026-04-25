// ============================================================
// PrismaSettingsRepository - SettingsRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { SettingsRepository } from '@/domain/repositories'
import { Setting } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { SettingMapper } from '../mappers'

export class PrismaSettingsRepository implements SettingsRepository {
  async get(key: string, workshopId?: string): Promise<string | null> {
    const where: Record<string, unknown> = { key }
    if (workshopId) where.workshopId = workshopId
    const setting = await prisma.setting.findFirst({ where })
    return setting ? setting.value : null
  }

  async set(key: string, value: string, workshopId?: string): Promise<void> {
    // If workshopId is provided, use the compound unique key
    if (workshopId) {
      await prisma.setting.upsert({
        where: { workshopId_key: { workshopId, key } },
        create: { workshopId, key, value },
        update: { value },
      })
    } else {
      // Legacy: find first setting with this key and update it
      const existing = await prisma.setting.findFirst({ where: { key } })
      if (existing) {
        await prisma.setting.update({
          where: { id: existing.id },
          data: { value },
        })
      } else {
        await prisma.setting.create({ data: { key, value, workshopId: '' } })
      }
    }
  }

  async getAll(workshopId?: string): Promise<Setting[]> {
    const where: Record<string, unknown> = {}
    if (workshopId) where.workshopId = workshopId
    const settings = await prisma.setting.findMany({ where })
    return settings.map((s) => SettingMapper.toDomain(s))
  }

  async delete(key: string, workshopId?: string): Promise<void> {
    const where: Record<string, unknown> = { key }
    if (workshopId) where.workshopId = workshopId
    await prisma.setting.deleteMany({ where })
  }
}
