import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { auditService } from '@/application/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'admin',
        provider: 'credentials',
      },
    });

    const sessionCookie = createSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      provider: user.provider,
    });

    const response = NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, provider: user.provider },
        message: 'Usuario registrado exitosamente',
      },
      { status: 201 }
    );

    response.cookies.set(sessionCookie);

    // Audit log
    await auditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REGISTER',
      entity: 'user',
      entityId: user.id,
      details: `Registro de nuevo usuario: ${email}`,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
