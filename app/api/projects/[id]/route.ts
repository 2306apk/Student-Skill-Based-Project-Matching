import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { query, execute, formatDbError } from '@/lib/mysql/client';
import { updateProjectSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/mongodb/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = Number(params.id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const projects = await query(
    `SELECT p.project_id, p.title, p.description, p.start_date, p.end_date,
            p.max_students, p.status, p.client_id, c.org_name as client_name,
            c.contact_name, c.industry, p.domain_id, d.domain_name,
            COUNT(pm.student_id) as active_members,
            (p.max_students - COUNT(pm.student_id)) as slots_left
     FROM PROJECT p
     JOIN CLIENT c ON c.client_id = p.client_id
     JOIN DOMAIN d ON d.domain_id = p.domain_id
     LEFT JOIN PROJECT_MEMBER pm ON pm.project_id = p.project_id AND pm.member_status = 'Active'
     WHERE p.project_id = ?
     GROUP BY p.project_id, p.title, p.description, p.start_date, p.end_date,
              p.max_students, p.status, p.client_id, c.org_name, c.contact_name, c.industry,
              p.domain_id, d.domain_name`,
    [projectId]
  );

  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const required_skills = await query(
    `SELECT ps.skill_id, s.skill_name, sc.category_name, ps.required_level, ps.importance
     FROM PROJECT_SKILL ps
     JOIN SKILL s ON s.skill_id = ps.skill_id
     JOIN SKILL_CATEGORY sc ON sc.category_id = s.category_id
     WHERE ps.project_id = ?
     ORDER BY ps.skill_id`,
    [projectId]
  );

  const active_member_list = await query(
    `SELECT pm.student_id, s.name as student_name, pm.role, pm.joined_date, pm.member_status
     FROM PROJECT_MEMBER pm
     JOIN STUDENT s ON s.student_id = pm.student_id
     WHERE pm.project_id = ?
     ORDER BY pm.joined_date ASC`,
    [projectId]
  );

  return NextResponse.json({
    project: {
      ...projects[0],
      required_skills,
      members: active_member_list,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  const projectId = Number(params.id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parsed.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.end_date);
    }
    if (updates.max_students !== undefined) {
      fields.push('max_students = ?');
      values.push(updates.max_students);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.client_id !== undefined) {
      fields.push('client_id = ?');
      values.push(updates.client_id);
    }
    if (updates.domain_id !== undefined) {
      fields.push('domain_id = ?');
      values.push(updates.domain_id);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    values.push(projectId);

    // This statement triggers Check_Project_Max_Students_Update if max_students is lowered below active members!
    await execute(`UPDATE PROJECT SET ${fields.join(', ')} WHERE project_id = ?`, values);

    await logActivity({
      eventType: 'PROJECT_UPDATED',
      projectId,
      userId: user.userId,
      metadata: updates,
    });

    return NextResponse.json({ success: true, message: 'Project updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await requireAuth(['ADMIN']);
  if (!user) return response;

  const projectId = Number(params.id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  try {
    const res: any = await execute(`DELETE FROM PROJECT WHERE project_id = ?`, [projectId]);
    if (res.affectedRows === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: formatDbError(err) }, { status: 400 });
  }
}
