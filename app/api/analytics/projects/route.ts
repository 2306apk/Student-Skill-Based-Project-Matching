import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  try {
    // 1. Skills per student (GROUP BY, aggregate COUNT and AVG)
    const skillsPerStudent = await query(`
      SELECT student_id, student_name,
             COUNT(skill_id) AS skill_count,
             COALESCE(ROUND(AVG(years_experience), 1), 0) AS avg_experience
      FROM Student_Skill_Profile
      GROUP BY student_id, student_name
      ORDER BY skill_count DESC
    `);

    // 2. Applicants by project
    const applicantsByProject = await query(`
      SELECT project_id, project_title, COUNT(*) AS applicant_count
      FROM Project_Applicants
      GROUP BY project_id, project_title
      ORDER BY applicant_count DESC
    `);

    // 3. Projects with more than one applicant (GROUP BY + HAVING)
    const projectsWithMultipleApplicants = await query(`
      SELECT project_id, project_title, COUNT(*) AS applicants
      FROM Project_Applicants
      GROUP BY project_id, project_title
      HAVING COUNT(*) > 1
      ORDER BY applicants DESC
    `);

    // 4. Average and highest match score per project (AVG and MAX)
    const matchScoresByProject = await query(`
      SELECT project_id, project_title,
             ROUND(AVG(match_score), 2) AS avg_score,
             MAX(match_score) AS best_score
      FROM Project_Match_Summary
      GROUP BY project_id, project_title
      ORDER BY avg_score DESC
    `);

    // 5. Matches above overall average match score (SUBQUERY)
    const matchesAboveAverage = await query(`
      SELECT student_id, student_name, project_id, project_title, match_score, match_status
      FROM Project_Match_Summary
      WHERE match_score > (SELECT AVG(match_score) FROM MATCH_RESULT)
      ORDER BY match_score DESC
    `);

    // 6. Project capacity utilization and slots left (LEFT JOIN + COUNT + GROUP BY)
    const capacityUtilization = await query(`
      SELECT p.project_id, p.title, p.max_students, p.status,
             COUNT(pm.student_id) AS active_members,
             (p.max_students - COUNT(pm.student_id)) AS slots_left,
             ROUND((COUNT(pm.student_id) / p.max_students) * 100, 1) AS utilization_percent
      FROM PROJECT p
      LEFT JOIN PROJECT_MEMBER pm
             ON pm.project_id = p.project_id AND pm.member_status = 'Active'
      GROUP BY p.project_id, p.title, p.max_students, p.status
      ORDER BY utilization_percent DESC
    `);

    return NextResponse.json({
      skillsPerStudent,
      applicantsByProject,
      projectsWithMultipleApplicants,
      matchScoresByProject,
      matchesAboveAverage,
      capacityUtilization,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
