import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getStudentActivity } from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  try {
    const activities = await getStudentActivity(user.studentId, 30);
    return NextResponse.json({ activities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
