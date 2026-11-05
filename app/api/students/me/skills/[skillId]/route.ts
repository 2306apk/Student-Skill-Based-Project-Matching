import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { execute, formatDbError, query } from '@/lib/mysql/client';
import { updateSkillSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  const skillId = Number(params.skillId);
  if (isNaN(skillId)) {
    return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { proficiency_level, years_experience } = parsed.data;

    const res: any = await execute(
      `UPDATE STUDENT_SKILL
       SET proficiency_level = ?, years_experience = ?
       WHERE student_id = ? AND skill_id = ?`,
      [proficiency_level, years_experience, user.studentId, skillId]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: 'Skill record not found' }, { status: 404 });
    }

    await logActivity({
      eventType: 'SKILL_UPDATED',
      studentId: user.studentId,
      userId: user.userId,
      metadata: { skillId, proficiency_level, years_experience },
    });

    return NextResponse.json({ success: true, message: 'Skill updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  const skillId = Number(params.skillId);
  if (isNaN(skillId)) {
    return NextResponse.json({ error: 'Invalid skill ID' }, { status: 400 });
  }

  try {
    const res: any = await execute(
      `DELETE FROM STUDENT_SKILL WHERE student_id = ? AND skill_id = ?`,
      [user.studentId, skillId]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: 'Skill record not found' }, { status: 404 });
    }

    await logActivity({
      eventType: 'SKILL_REMOVED',
      studentId: user.studentId,
      userId: user.userId,
      metadata: { skillId },
    });

    return NextResponse.json({ success: true, message: 'Skill removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

