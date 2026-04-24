import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const SESSION_COOKIE = 'tallertech_session';
const SECRET = 'tallertech-secret-key-2024';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + SECRET).digest('hex');
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;
  try {
    const decoded = Buffer.from(session.value, 'base64').toString();
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function createSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const value = Buffer.from(JSON.stringify(user)).toString('base64');
  return { name: SESSION_COOKIE, value, httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 };
}

export function clearSessionCookie() {
  return { name: SESSION_COOKIE, value: '', httpOnly: true, path: '/', maxAge: 0 };
}
