import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { auditService } from '@/application/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Check if user is Google OAuth only
    if (user.provider === 'google' && !user.password) {
      return NextResponse.json(
        { error: 'Esta cuenta usa autenticación con Google. Use el botón "Iniciar con Google".' },
        { status: 401 }
      );
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Cuenta desactivada' },
        { status: 401 }
      );
    }

    const sessionCookie = createSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      provider: user.provider,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image, provider: user.provider },
      message: 'Login exitoso',
    });

    response.cookies.set(sessionCookie);

    // Audit log
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
      details: 'Inicio de sesión con credenciales',
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
