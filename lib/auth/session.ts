import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from './jwt';
import { SessionUser, UserRole } from '@/types';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<{
  user: SessionUser | null;
  response?: NextResponse;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: `Forbidden: Requires role in [${allowedRoles.join(', ')}]` },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Checks student ownership to prevent URL tampering.
 * If user is a student, verifies they are accessing their own student_id.
 * If user is an ADMIN, allows access.
 */
export function verifyStudentAccess(user: SessionUser, targetStudentId: number): boolean {
  if (user.role === 'ADMIN') return true;
  return user.studentId === targetStudentId;
}
