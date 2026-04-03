import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'vitalink-dev-secret-key-change-in-production-2026'
);

const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'vitalink_session';

export interface SessionUser {
  id: string;
  username: string;
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  specialty?: string;
}

export interface TokenPayload extends JWTPayload {
  id: string;
  username: string;
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  specialty?: string;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    specialty: user.specialty,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(AUTH_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export { COOKIE_NAME };
