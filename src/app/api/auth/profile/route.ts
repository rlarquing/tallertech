// ============================================================
// Profile API — update user name and password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { cookieSession } from '@/infrastructure/auth/cookie-session'

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await cookieSession.getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // Fetch full user from DB to get password hash
    const dbUser = await db.user.findUnique({ where: { id: sessionUser.id } })
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const updates: Record<string, string> = {}

    // Update name if changed
    if (typeof name === 'string' && name.trim() && name.trim() !== sessionUser.name) {
      updates.name = name.trim()
    }

    // Update email if changed
    if (typeof email === 'string' && email.trim() && email.trim() !== sessionUser.email) {
      // Check email isn't taken by another user
      const existing = await db.user.findUnique({ where: { email: email.trim() } })
      if (existing && existing.id !== dbUser.id) {
        return NextResponse.json({ error: 'Ese email ya está registrado por otro usuario' }, { status: 409 })
      }
      updates.email = email.trim()
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Contraseña actual requerida' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      const hashedCurrent = hashPassword(currentPassword)
      if (hashedCurrent !== dbUser.password) {
        return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
      }
      updates.password = hashPassword(newPassword)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Sin cambios' })
    }

    await db.user.update({ where: { id: dbUser.id }, data: updates })

    // Update session cookie with new name/email
    const updatedUser = {
      id: dbUser.id,
      email: updates.email || dbUser.email,
      name: updates.name || sessionUser.name,
      role: sessionUser.role,
    }
    const response = NextResponse.json({
      message: 'Perfil actualizado',
      user: updatedUser,
    })
    response.cookies.set(cookieSession.createSessionCookie(updatedUser))
    return response
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
