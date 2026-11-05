import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['STUDENT']);
  if (!user || !user.studentId) return response;

  // Uses existing View: Project_Match_Summary
  const matches = await query(
    `SELECT student_id, student_name, result_no, project_id, project_title,
            match_score, matched_skills, missing_skills, match_status
     FROM Project_Match_Summary
     WHERE student_id = ?
     ORDER BY match_score DESC, result_no ASC`,
    [user.studentId]
  );

  return NextResponse.json({ matches });
}
