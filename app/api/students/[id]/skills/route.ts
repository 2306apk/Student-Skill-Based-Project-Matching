import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  const studentId = Number(params.id);
  if (isNaN(studentId)) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  // Uses existing View: Student_Skill_Profile
  const skills = await query(
    `SELECT student_id, student_name, year, cgpa, department,
            skill_id, skill_name, skill_category, proficiency_level, years_experience
     FROM Student_Skill_Profile
     WHERE student_id = ? AND skill_id IS NOT NULL
     ORDER BY skill_category ASC, skill_name ASC`,
    [studentId]
  );

  return NextResponse.json({ skills });
}
