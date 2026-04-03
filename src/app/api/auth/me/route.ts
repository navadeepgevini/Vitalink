import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        fullName: payload.fullName,
        specialty: payload.specialty,
      }
    });
  } catch {
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
