import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUsername } from '@/lib/dataStore';
import { createToken, getCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create JWT token
    const sessionUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      specialty: user.specialty,
    };

    const token = await createToken(sessionUser);
    const cookieOpts = getCookieOptions();

    // Set httpOnly cookie with JWT
    const response = NextResponse.json({
      message: 'Login successful',
      user: sessionUser,
    });

    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Login failed', detail: error?.message }, { status: 500 });
  }
}
