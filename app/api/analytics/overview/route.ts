import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query } from '@/lib/mysql/client';
import { getActivityCollection } from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['ADMIN', 'STUDENT']);
  if (!user) return response;

  try {
    const [
      studentCount,
      projectCount,
      openProjectCount,
      appCount,
      activeMemberCount,
      avgMatch,
    ] = await Promise.all([
      query<{ count: number }>('SELECT COUNT(*) as count FROM STUDENT'),
      query<{ count: number }>('SELECT COUNT(*) as count FROM PROJECT'),
      query<{ count: number }>("SELECT COUNT(*) as count FROM PROJECT WHERE status = 'Open'"),
      query<{ count: number }>('SELECT COUNT(*) as count FROM APPLICATION'),
      query<{ count: number }>(
        "SELECT COUNT(*) as count FROM PROJECT_MEMBER WHERE member_status = 'Active'"
      ),
      query<{ avg_score: number }>(
        'SELECT ROUND(AVG(match_score), 2) as avg_score FROM MATCH_RESULT'
      ),
    ]);

    let activityCount = 0;
    try {
      const col = await getActivityCollection();
      activityCount = await col.countDocuments();
    } catch {
      activityCount = 0;
    }

    return NextResponse.json({
      totalStudents: studentCount[0]?.count || 0,
      totalProjects: projectCount[0]?.count || 0,
      openProjects: openProjectCount[0]?.count || 0,
      totalApplications: appCount[0]?.count || 0,
      activeMembers: activeMemberCount[0]?.count || 0,
      averageMatchScore: avgMatch[0]?.avg_score || 0,
      activityCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
