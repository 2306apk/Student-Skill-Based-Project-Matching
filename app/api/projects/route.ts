import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute, formatDbError, withTransaction } from '@/lib/mysql/client';
import { createProjectSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const domainId = url.searchParams.get('domain_id');

  let sql = `
    SELECT p.project_id, p.title, p.description, p.start_date, p.end_date,
           p.max_students, p.status, p.client_id, c.org_name as client_name,
           p.domain_id, d.domain_name,
           COUNT(pm.student_id) as active_members,
           (p.max_students - COUNT(pm.student_id)) as slots_left
    FROM PROJECT p
    JOIN CLIENT c ON c.client_id = p.client_id
    JOIN DOMAIN d ON d.domain_id = p.domain_id
    LEFT JOIN PROJECT_MEMBER pm ON pm.project_id = p.project_id AND pm.member_status = 'Active'
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }
  if (domainId) {
    sql += ` AND p.domain_id = ?`;
    params.push(Number(domainId));
  }

  sql += ` GROUP BY p.project_id, p.title, p.description, p.start_date, p.end_date,
                    p.max_students, p.status, p.client_id, c.org_name, p.domain_id, d.domain_name
           ORDER BY p.project_id ASC`;

  const projects = await query(sql, params);

  // Fetch required skills for each project
  const skillReqs = await query(
    `SELECT ps.project_id, ps.skill_id, s.skill_name, ps.required_level, ps.importance
     FROM PROJECT_SKILL ps
     JOIN SKILL s ON s.skill_id = ps.skill_id
     ORDER BY ps.project_id, ps.skill_id`
  );

  const skillsByProject = new Map<number, any[]>();
  for (const sr of skillReqs) {
    const list = skillsByProject.get(sr.project_id) || [];
    list.push(sr);
    skillsByProject.set(sr.project_id, list);
  }

  const enriched = projects.map((p: any) => ({
    ...p,
    required_skills: skillsByProject.get(p.project_id) || [],
  }));

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  try {
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid project data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      project_id,
      title,
      description,
      start_date,
      end_date,
      max_students,
      status,
      client_id,
      domain_id,
      required_skills,
    } = parsed.data;

    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO PROJECT (project_id, title, description, start_date, end_date, max_students, status, client_id, domain_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project_id,
          title,
          description || null,
          start_date || null,
          end_date || null,
          max_students,
          status,
          client_id,
          domain_id,
        ]
      );

      if (required_skills && required_skills.length > 0) {
        for (const sk of required_skills) {
          await conn.execute(
            `INSERT INTO PROJECT_SKILL (project_id, skill_id, required_level, importance)
             VALUES (?, ?, ?, ?)`,
            [project_id, sk.skill_id, sk.required_level, sk.importance || 'Medium']
          );
        }
      }
    });

    await logActivity({
      eventType: 'PROJECT_CREATED',
      projectId: project_id,
      userId: user.userId,
      metadata: { title, max_students, status, client_id, domain_id },
    });

    return NextResponse.json({ success: true, message: 'Project created successfully' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}
