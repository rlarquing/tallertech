// ============================================================
// PrismaSettingsRepository - SettingsRepository implementation using Prisma
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { SettingsRepository } from '@/domain/repositories'
import { Setting } from '@/domain/entities'
import { prisma } from '../prisma-client'
import { SettingMapper } from '../mappers'

export class PrismaSettingsRepository implements SettingsRepository {
  async get(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting ? setting.value : null
  }

  async set(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  }

  async getAll(): Promise<Setting[]> {
    const settings = await prisma.setting.findMany()
    return settings.map((s) => SettingMapper.toDomain(s))
  }

  async delete(key: string): Promise<void> {
    await prisma.setting.deleteMany({ where: { key } })
  }
}
