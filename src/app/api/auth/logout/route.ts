import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearSessionCookie } from '@/lib/auth';
import { auditService } from '@/application/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      // Audit log
      await auditService.log({
        userId: user.id,
        userName: user.name,
        action: 'LOGOUT',
        entity: 'user',
        entityId: user.id,
        details: 'Cierre de sesión',
        ip: request.headers.get('x-forwarded-for') || undefined,
      });
    }

    const response = NextResponse.json({ message: 'Sesión cerrada exitosamente' });
    response.cookies.set(clearSessionCookie());
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
