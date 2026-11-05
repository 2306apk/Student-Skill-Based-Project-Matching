import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute, formatDbError } from '@/lib/mysql/client';
import { updateApplicationStatusSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';
import { ActivityEventType } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await requireAuth(['STUDENT', 'ADMIN']);
  if (!user) return response;

  // Composite key formatted as "studentId-projectId" or "studentId_projectId"
  const rawId = params.id;
  const parts = rawId.includes('-') ? rawId.split('-') : rawId.split('_');
  if (parts.length !== 2) {
    return NextResponse.json({ error: 'Application ID must be format: studentId-projectId' }, { status: 400 });
  }

  const studentId = Number(parts[0]);
  const projectId = Number(parts[1]);

  if (isNaN(studentId) || isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid application identifier' }, { status: 400 });
  }

  // Authorization check
  if (user.role === 'STUDENT' && user.studentId !== studentId) {
    return NextResponse.json({ error: 'Forbidden: Cannot modify another student\'s application' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Student can only withdraw
    if (user.role === 'STUDENT' && status !== 'Withdrawn') {
      return NextResponse.json(
        { error: 'Students can only change status to Withdrawn' },
        { status: 403 }
      );
    }

    // Check application exists
    const current = await query(
      `SELECT status FROM APPLICATION WHERE student_id = ? AND project_id = ?`,
      [studentId, projectId]
    );

    if (current.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (current[0].status === 'Selected') {
      return NextResponse.json(
        { error: 'Cannot modify an application that has already been Selected' },
        { status: 400 }
      );
    }

    await execute(
      `UPDATE APPLICATION SET status = ? WHERE student_id = ? AND project_id = ?`,
      [status, studentId, projectId]
    );

    let eventType: ActivityEventType = 'APPLICATION_SHORTLISTED';
    if (status === 'Shortlisted') eventType = 'APPLICATION_SHORTLISTED';
    else if (status === 'Rejected') eventType = 'APPLICATION_REJECTED';
    else if (status === 'Withdrawn') eventType = 'APPLICATION_WITHDRAWN';
    else if (status === 'Selected') eventType = 'APPLICATION_SELECTED';

    await logActivity({
      eventType,
      studentId,
      projectId,
      userId: user.userId,
      metadata: { previousStatus: current[0].status, newStatus: status },
    });

    return NextResponse.json({ success: true, message: `Application status updated to ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

