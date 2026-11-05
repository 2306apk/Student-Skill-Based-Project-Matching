import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute, formatDbError } from '@/lib/mysql/client';
import { addSkillSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  // Uses the existing View: Student_Skill_Profile
  const skills = await query(
    `SELECT student_id, student_name, year, cgpa, department,
            skill_id, skill_name, skill_category, proficiency_level, years_experience
     FROM Student_Skill_Profile
     WHERE student_id = ? AND skill_id IS NOT NULL
     ORDER BY skill_category ASC, skill_name ASC`,
    [user.studentId]
  );

  return NextResponse.json({ skills });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  try {
    const body = await req.json();
    const parsed = addSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid skill data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { skill_id, proficiency_level, years_experience } = parsed.data;

    // Check if skill already recorded
    const existing = await query(
      `SELECT skill_id FROM STUDENT_SKILL WHERE student_id = ? AND skill_id = ?`,
      [user.studentId, skill_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already recorded this skill. Please update it instead.' },
        { status: 409 }
      );
    }

    // Insert into STUDENT_SKILL
    await execute(
      `INSERT INTO STUDENT_SKILL (student_id, skill_id, proficiency_level, years_experience)
       VALUES (?, ?, ?, ?)`,
      [user.studentId, skill_id, proficiency_level, years_experience]
    );

    // Fetch skill name for audit log
    const skillInfo = await query<{ skill_name: string }>(
      `SELECT skill_name FROM SKILL WHERE skill_id = ?`,
      [skill_id]
    );
    const skillName = skillInfo[0]?.skill_name || 'Unknown Skill';

    // Log to MongoDB
    await logActivity({
      eventType: 'SKILL_ADDED',
      studentId: user.studentId,
      userId: user.userId,
      metadata: { skillId: skill_id, skillName, proficiency_level, years_experience },
    });

    return NextResponse.json({ success: true, message: 'Skill recorded successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}
