import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, formatDbError } from '@/lib/mysql/client';
import { selectCandidateSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  try {
    const body = await req.json();
    const parsed = selectCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid selection parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { student_id, project_id, role } = parsed.data;

    // Call existing stored procedure: Select_Student_For_Project
    // This executes an atomic database transaction with SELECT FOR UPDATE row locking,
    // verifies application status IN ('Applied', 'Shortlisted'), sets status = 'Selected',
    // and inserts into PROJECT_MEMBER (which in turn fires Check_Project_Capacity trigger).
    // On any error, it performs a database-level ROLLBACK.
    await query(`CALL Select_Student_For_Project(?, ?, ?)`, [
      student_id,
      project_id,
      role.trim(),
    ]);

    // Log to MongoDB after database transaction commits
    await logActivity({
      eventType: 'APPLICATION_SELECTED',
      studentId: student_id,
      projectId: project_id,
      userId: user.userId,
      metadata: { role, selectionMechanism: 'Select_Student_For_Project Stored Procedure' },
    });

    return NextResponse.json({
      success: true,
      message: `Student #${student_id} successfully selected for Project #${project_id} as "${role}".`,
    });
  } catch (err: any) {
    console.error('Selection procedure error:', err);
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

