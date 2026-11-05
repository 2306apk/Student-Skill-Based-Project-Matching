import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, formatDbError } from '@/lib/mysql/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  const projectId = Number(params.projectId);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    // Concept 2: Stored Procedure execution
    // CALL Get_Project_Matches(?) returns ranked match results ordered by score DESC
    const results: any = await query(`CALL Get_Project_Matches(?)`, [projectId]);
    
    // In mysql2, procedure results are in results[0]
    const matches = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : results;

    return NextResponse.json({
      projectId,
      source: 'Stored Procedure: Get_Project_Matches',
      matches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

