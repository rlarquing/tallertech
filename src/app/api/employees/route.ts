import { NextRequest } from 'next/server'
import { requireAuth } from '@/interfaces/http/middlewares/auth.middleware'
import { ResponsePresenter } from '@/interfaces/http/presenters/response.presenter'
import { CookieSession } from '@/infrastructure/auth/cookie-session'
import { PasswordHasher } from '@/infrastructure/auth/password-hasher'
import { prisma } from '@/infrastructure/persistence/prisma/prisma-client'
import '@/infrastructure/container'
import { UseCaseContainer } from '@/application/container'

const cookieSession = new CookieSession()
const passwordHasher = new PasswordHasher()
const useCases = UseCaseContainer.getInstance()

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate & authorize
    const authResult = await requireAuth(request)
    if ('status' in authResult) return authResult // 401 response

    const currentUser = authResult
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return ResponsePresenter.error({ message: 'Solo el propietario o administrador puede crear empleados', code: 'AUTHORIZATION_ERROR' })
    }

    // 2. Parse and validate body
    const body = await request.json()
    const { name, email, password, role, workshopId } = body

    if (!name || !email || !password || !workshopId) {
      return ResponsePresenter.error({ message: 'Nombre, email, contraseña y taller son requeridos', code: 'VALIDATION_ERROR' })
    }

    if (password.length < 6) {
      return ResponsePresenter.error({ message: 'La contraseña debe tener al menos 6 caracteres', code: 'VALIDATION_ERROR' })
    }

    // 3. Check caller is member of the workshop
    const callerRole = await useCases.addWorkshopMember.execute
      ? null
      : null
    const membership = await prisma.workshopUser.findUnique({
      where: { workshopId_userId: { workshopId, userId: currentUser.id } },
    })
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return ResponsePresenter.error({ message: 'No tiene permisos para agregar empleados a este taller', code: 'AUTHORIZATION_ERROR' })
    }

    // 4. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    let userId: string

    if (existingUser) {
      // User exists — check if already a member
      const existingMembership = await prisma.workshopUser.findUnique({
        where: { workshopId_userId: { workshopId, userId: existingUser.id } },
      })
      if (existingMembership) {
        return ResponsePresenter.error({ message: 'Este usuario ya es miembro del taller', code: 'VALIDATION_ERROR' })
      }
      userId = existingUser.id
    } else {
      // Create new user
      const hashedPassword = passwordHasher.hash(password)
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role || 'employee',
          active: true,
        },
      })
      userId = newUser.id
    }

    // 5. Add user to workshop
    const memberRole = role || 'employee'
    const newMember = await prisma.workshopUser.create({
      data: {
        workshopId,
        userId,
        role: memberRole,
      },
      include: {
        user: true,
      },
    })

    // 6. Audit log
    try {
      await prisma.auditLog.create({
        data: {
          workshopId,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'CREATE',
          entity: 'employee',
          entityId: userId,
          details: JSON.stringify({ employeeName: name, employeeEmail: email, role: memberRole }),
        },
      })
    } catch {
      // Audit log is optional
    }

    return ResponsePresenter.created({
      message: 'Empleado creado exitosamente',
      data: {
        id: newMember.id,
        workshopId: newMember.workshopId,
        userId: newMember.userId,
        userName: newMember.user.name,
        userEmail: newMember.user.email,
        userImage: newMember.user.image,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
      },
    })
  } catch (error) {
    return ResponsePresenter.error(error)
  }
}
