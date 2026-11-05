import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let extraData = {};
  if (user.role === 'STUDENT' && user.studentId) {
    const studentRows = await query(
      `SELECT s.student_id, s.name, s.year, s.cgpa, d.dept_name, sup.name as supervisor_name
       FROM STUDENT s
       JOIN DEPARTMENT d ON d.dept_id = s.dept_id
       LEFT JOIN STUDENT sup ON sup.student_id = s.supervisor_id
       WHERE s.student_id = ?`,
      [user.studentId]
    );
    if (studentRows.length > 0) {
      extraData = studentRows[0];
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      ...extraData,
    },
  });
}
