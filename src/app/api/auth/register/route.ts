import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { addUser, findUserByUsername, findUserByEmail, type User } from '@/lib/dataStore';
import { createToken, getCookieOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, email, password, role, fullName, specialty } = await request.json();

    if (!username || !email || !password || !role || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (findUserByUsername(username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      role,
      fullName,
      specialty: role === 'doctor' ? specialty : undefined,
      createdAt: new Date().toISOString(),
    };

    addUser(newUser);

    // Auto-login after registration: create JWT and set cookie
    const sessionUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role as 'patient' | 'doctor' | 'admin',
      fullName: newUser.fullName,
      specialty: newUser.specialty,
    };

    const token = await createToken(sessionUser);
    const cookieOpts = getCookieOptions();

    const response = NextResponse.json({
      message: 'Registration successful',
      user: sessionUser,
    }, { status: 201 });

    response.cookies.set(cookieOpts.name, token, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Registration failed', detail: error?.message }, { status: 500 });
  }
}
