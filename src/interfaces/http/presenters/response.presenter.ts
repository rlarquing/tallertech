// ============================================================
// Response Presenter - Consistent API response formatting
// Clean Architecture: Interface Adapters Layer
// ============================================================

import { NextResponse } from 'next/server'
import { DomainError } from '@/domain/errors'

export class ResponsePresenter {
  static success(data: unknown, status = 200): NextResponse {
    return NextResponse.json(data, { status })
  }

  static created(data: unknown): NextResponse {
    return NextResponse.json(data, { status: 201 })
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): NextResponse {
    return NextResponse.json({ data, total, page, limit })
  }

  static error(error: unknown): NextResponse {
    if (error instanceof DomainError) {
      const statusMap: Record<string, number> = {
        AUTHENTICATION_ERROR: 401,
        AUTHORIZATION_ERROR: 403,
        ENTITY_NOT_FOUND: 404,
        VALIDATION_ERROR: 400,
        INSUFFICIENT_STOCK: 400,
        INVALID_STATE_TRANSITION: 400,
        DUPLICATE_SKU: 400,
        INVALID_EMAIL: 400,
      }
      const status = statusMap[error.code] || 400
      return NextResponse.json({ error: error.message }, { status })
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }

  static binary(
    buffer: Buffer,
    contentType: string,
    filename: string,
  ): NextResponse {
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  }
}
