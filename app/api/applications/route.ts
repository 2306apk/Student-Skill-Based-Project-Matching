import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute, formatDbError } from '@/lib/mysql/client';
import { submitApplicationSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(['STUDENT', 'ADMIN']);
  if (!user) return response;

  const url = new URL(req.url);
  const projectId = url.searchParams.get('project_id');
  const status = url.searchParams.get('status');

  // If student, force filter by student_id to prevent accessing other students' records
  let sql = '';
  const params: any[] = [];

  if (user.role === 'STUDENT') {
    sql = `
      SELECT a.student_id, s.name as student_name, s.cgpa, a.project_id,
             p.title as project_title, p.status as project_status,
             a.application_date, a.status as application_status
      FROM APPLICATION a
      JOIN STUDENT s ON s.student_id = a.student_id
      JOIN PROJECT p ON p.project_id = a.project_id
      WHERE a.student_id = ?
      ORDER BY a.application_date DESC
    `;
    params.push(user.studentId);
  } else {
    // Admin uses the existing View: Project_Applicants
    sql = `
      SELECT student_id, student_name, cgpa, project_id,
             project_title, project_status, application_date, application_status
      FROM Project_Applicants
      WHERE 1=1
    `;
    if (projectId) {
      sql += ` AND project_id = ?`;
      params.push(Number(projectId));
    }
    if (status) {
      sql += ` AND application_status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY application_date DESC, project_id ASC`;
  }

  const applications = await query(sql, params);
  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  try {
    const body = await req.json();
    const parsed = submitApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid application submission', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { project_id } = parsed.data;

    // Check if duplicate application
    const existing = await query(
      `SELECT status FROM APPLICATION WHERE student_id = ? AND project_id = ?`,
      [user.studentId, project_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `You have already applied for this project (Status: ${existing[0].status})` },
        { status: 409 }
      );
    }

    // This INSERT activates Trigger: Check_Application_Eligibility
    // If the project is closed, full, or non-existent, the trigger raises a readable error!
    await execute(
      `INSERT INTO APPLICATION (student_id, project_id, application_date, status)
       VALUES (?, ?, CURDATE(), 'Applied')`,
      [user.studentId, project_id]
    );

    await logActivity({
      eventType: 'APPLICATION_SUBMITTED',
      studentId: user.studentId,
      projectId: project_id,
      userId: user.userId,
      metadata: { applicationDate: new Date().toISOString().split('T')[0] },
    });

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully' },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}
