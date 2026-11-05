import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [skills, categories, departments, domains, clients] = await Promise.all([
    query(`SELECT s.skill_id, s.skill_name, s.category_id, sc.category_name
           FROM SKILL s
           JOIN SKILL_CATEGORY sc ON sc.category_id = s.category_id
           ORDER BY sc.category_name ASC, s.skill_name ASC`),
    query(`SELECT category_id, category_name FROM SKILL_CATEGORY ORDER BY category_name ASC`),
    query(`SELECT dept_id, dept_name FROM DEPARTMENT ORDER BY dept_name ASC`),
    query(`SELECT domain_id, domain_name FROM DOMAIN ORDER BY domain_name ASC`),
    query(`SELECT client_id, org_name, contact_name, industry FROM CLIENT ORDER BY org_name ASC`),
  ]);

  return NextResponse.json({
    skills,
    categories,
    departments,
    domains,
    clients,
  });
}
