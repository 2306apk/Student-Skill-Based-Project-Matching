import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  const rows = await query(
    `SELECT s.student_id, s.name, s.year, s.cgpa, s.dept_id, d.dept_name,
            sup.name as supervisor_name
     FROM STUDENT s
     JOIN DEPARTMENT d ON d.dept_id = s.dept_id
     LEFT JOIN STUDENT sup ON sup.student_id = s.supervisor_id
     WHERE s.student_id = ?`,
    [user.studentId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
  }

  const emails = await query<{ email: string }>(
    `SELECT email FROM STUDENT_EMAIL WHERE student_id = ? ORDER BY email ASC`,
    [user.studentId]
  );

  return NextResponse.json({
    student: {
      ...rows[0],
      emails: emails.map((e) => e.email),
    },
  });
}
