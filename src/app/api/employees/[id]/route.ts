import { NextRequest } from 'next/server'
import { requireAuth } from '@/interfaces/http/middlewares/auth.middleware'
import { ResponsePresenter } from '@/interfaces/http/presenters/response.presenter'
import { PasswordHasher } from '@/infrastructure/auth/password-hasher'
import { prisma } from '@/infrastructure/persistence/prisma/prisma-client'

const passwordHasher = new PasswordHasher()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate & authorize
    const authResult = await requireAuth(request)
    if ('status' in authResult) return authResult

    const currentUser = authResult
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return ResponsePresenter.error({ message: 'Solo el propietario o administrador puede editar empleados', code: 'AUTHORIZATION_ERROR' })
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, workshopId } = body

    // 2. Verify the target user exists
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return ResponsePresenter.error({ message: 'Usuario no encontrado', code: 'ENTITY_NOT_FOUND' })
    }

    // 3. If workshopId provided, verify caller has admin/owner access
    if (workshopId) {
      const membership = await prisma.workshopUser.findUnique({
        where: { workshopId_userId: { workshopId, userId: currentUser.id } },
      })
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return ResponsePresenter.error({ message: 'No tiene permisos para editar empleados en este taller', code: 'AUTHORIZATION_ERROR' })
      }
    }

    // 4. Check email uniqueness if changing email
    if (email && email !== targetUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        return ResponsePresenter.error({ message: 'Ya existe un usuario con este email', code: 'VALIDATION_ERROR' })
      }
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (password && password.length >= 6) {
      updateData.password = passwordHasher.hash(password)
    }

    // 6. Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // 7. Audit log
    if (workshopId) {
      try {
        await prisma.auditLog.create({
          data: {
            workshopId,
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'UPDATE',
            entity: 'employee',
            entityId: id,
            details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
          },
        })
      } catch {
        // Audit log is optional
      }
    }

    return ResponsePresenter.success({
      message: 'Empleado actualizado exitosamente',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        active: updatedUser.active,
        image: updatedUser.image,
      },
    })
  } catch (error) {
    return ResponsePresenter.error(error)
  }
}
