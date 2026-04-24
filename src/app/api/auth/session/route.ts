import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 401 }
      );
    }
    return NextResponse.json({ isAuthenticated: true, user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesión' },
      { status: 500 }
    );
  }
}
