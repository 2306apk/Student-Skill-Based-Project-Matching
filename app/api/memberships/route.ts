import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(['STUDENT', 'ADMIN']);
  if (!user) return response;

  const url = new URL(req.url);
  const projectId = url.searchParams.get('project_id');

  let sql = `
    SELECT pm.student_id, s.name as student_name, pm.project_id, p.title as project_title,
           pm.role, pm.joined_date, pm.member_status, p.max_students, p.status as project_status
    FROM PROJECT_MEMBER pm
    JOIN STUDENT s ON s.student_id = pm.student_id
    JOIN PROJECT p ON p.project_id = pm.project_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role === 'STUDENT') {
    sql += ` AND pm.student_id = ?`;
    params.push(user.studentId);
  } else if (projectId) {
    sql += ` AND pm.project_id = ?`;
    params.push(Number(projectId));
  }

  sql += ` ORDER BY pm.joined_date DESC, pm.project_id ASC`;

  const memberships = await query(sql, params);
  return NextResponse.json({ memberships });
}
