import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import {
  getEventCountsByType,
  getProjectActivityBreakdown,
  getDailyActivityTrend,
} from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  try {
    const [eventsByType, projectBreakdown, dailyTrend] = await Promise.all([
      getEventCountsByType(),
      getProjectActivityBreakdown(),
      getDailyActivityTrend(14),
    ]);

    return NextResponse.json({
      eventsByType,
      projectBreakdown,
      dailyTrend,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
