import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const deptId = url.searchParams.get('dept_id') || '';
  const year = url.searchParams.get('year') || '';

  let sql = `
    SELECT s.student_id, s.name, s.year, s.cgpa, s.dept_id, d.dept_name,
           sup.name as supervisor_name,
           GROUP_CONCAT(DISTINCT se.email ORDER BY se.email SEPARATOR ', ') as emails,
           COUNT(DISTINCT ss.skill_id) as total_skills
    FROM STUDENT s
    JOIN DEPARTMENT d ON d.dept_id = s.dept_id
    LEFT JOIN STUDENT sup ON sup.student_id = s.supervisor_id
    LEFT JOIN STUDENT_EMAIL se ON se.student_id = s.student_id
    LEFT JOIN STUDENT_SKILL ss ON ss.student_id = s.student_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (s.name LIKE ? OR CAST(s.student_id AS CHAR) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (deptId) {
    sql += ` AND s.dept_id = ?`;
    params.push(Number(deptId));
  }
  if (year) {
    sql += ` AND s.year = ?`;
    params.push(Number(year));
  }

  sql += ` GROUP BY s.student_id, s.name, s.year, s.cgpa, s.dept_id, d.dept_name, sup.name
           ORDER BY s.student_id ASC`;

  const students = await query(sql, params);
  return NextResponse.json({ students });
}
