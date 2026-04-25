// ============================================================
// Setting Mapper - Prisma <-> Domain entity conversion
// Clean Architecture: Infrastructure Layer - Persistence
// ============================================================

import { Setting } from '@/domain/entities'

export class SettingMapper {
  /**
   * Convert a Prisma Setting record to a Domain Setting entity
   */
  static toDomain(prismaSetting: {
    id: string
    key: string
    value: string
  }): Setting {
    return Setting.create({
      id: prismaSetting.id,
      key: prismaSetting.key,
      value: prismaSetting.value,
    })
  }

  /**
   * Convert a Domain Setting entity to a Prisma-compatible data object
   */
  static toPrisma(setting: Setting): {
    id: string
    key: string
    value: string
  } {
    const plain = setting.toPlainObject()
    return {
      id: plain.id,
      key: plain.key,
      value: plain.value,
    }
  }
}
