import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, formatDbError } from '@/lib/mysql/client';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';
import { AppUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credentials format', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Retrieve user from APP_USER table
    const users = await query<AppUser>(
      `SELECT u.user_id, u.email, u.password_hash, u.role, u.student_id, s.name as student_name
       FROM APP_USER u
       LEFT JOIN STUDENT s ON s.student_id = u.student_id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      studentId: user.student_id,
      name: (user as any).student_name || (user.role === 'ADMIN' ? 'System Administrator' : 'Student'),
    };

    const token = await createSessionToken(sessionPayload);

    // Non-blocking MongoDB audit log
    await logActivity({
      eventType: 'USER_LOGIN',
      userId: user.user_id,
      studentId: user.student_id,
      metadata: { role: user.role, email: user.email },
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard',
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: formatDbError(err) }, { status: 500 });
  }
}

