import { SignJWT, jwtVerify } from 'jose';
import { SessionUser } from '@/types';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'student_skill_project_matching_jwt_secret_pes_university_2026'
);

const COOKIE_NAME = 'dbms_session';
const EXPIRY = '24h';

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as any,
      studentId: payload.studentId as number | null,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };

