import { formatDbError } from '../lib/mysql/client';
import { createSessionToken, verifySessionToken } from '../lib/auth/jwt';
import {
  loginSchema,
  addSkillSchema,
  createProjectSchema,
  selectCandidateSchema,
} from '../lib/validation/schemas';
import { verifyStudentAccess } from '../lib/auth/session';

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING AUTOMATED UNIT & INTEGRATION TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST SUITE 1: MySQL Error Formatter (Trigger & Constraint translation)
  console.log('[Suite 1] Database Error Translation');
  const triggerErr = {
    sqlState: '45000',
    message: 'ER_SIGNAL_EXCEPTION: Application rejected: project is not open',
  };
  assert(
    formatDbError(triggerErr) === 'Application rejected: project is not open',
    'Unwraps trigger SIGNAL SQLSTATE 45000 into clean error'
  );

  const dupErr = { code: 'ER_DUP_ENTRY', message: 'Duplicate entry' };
  assert(
    formatDbError(dupErr) === 'A record with these details already exists.',
    'Translates ER_DUP_ENTRY to user-friendly message'
  );

  const fkErr = { code: 'ER_ROW_IS_REFERENCED_2', message: 'Foreign key failure' };
  assert(
    formatDbError(fkErr).includes('referenced by other database records'),
    'Handles foreign key deletion warning'
  );

  // TEST SUITE 2: JWT Creation & Verification
  console.log('\n[Suite 2] JWT & Session Handling');
  const userPayload = {
    userId: 1,
    email: 'admin@college.edu',
    role: 'ADMIN' as const,
    studentId: null,
    name: 'Administrator',
  };
  const token = await createSessionToken(userPayload);
  assert(typeof token === 'string' && token.length > 20, 'Generates secure signed JWT');

  const decoded = await verifySessionToken(token);
  assert(
    decoded !== null && decoded.email === 'admin@college.edu' && decoded.role === 'ADMIN',
    'Verifies valid token and extracts session payload'
  );

  const invalidDecoded = await verifySessionToken('invalid.token.here');
  assert(invalidDecoded === null, 'Rejects forged or expired token');

  // TEST SUITE 3: Role & Student URL Tampering Protection
  console.log('\n[Suite 3] Access Control & URL Tampering Prevention');
  const studentSession = {
    userId: 2,
    email: 'rahul@gmail.com',
    role: 'STUDENT' as const,
    studentId: 101,
  };
  assert(
    verifyStudentAccess(studentSession, 101) === true,
    'Allows student to access own student_id (101)'
  );
  assert(
    verifyStudentAccess(studentSession, 102) === false,
    'Blocks student from accessing other student_id (102)'
  );
  assert(
    verifyStudentAccess(userPayload, 102) === true,
    'Allows admin role universal access'
  );

  // TEST SUITE 4: Input Validation Schemas
  console.log('\n[Suite 4] Zod Validation Schemas');
  const validLogin = loginSchema.safeParse({ email: 'rahul@gmail.com', password: 'Password123' });
  assert(validLogin.success === true, 'Validates well-formed login input');

  const invalidEmail = loginSchema.safeParse({ email: 'not-an-email', password: '123' });
  assert(invalidEmail.success === false, 'Rejects invalid email format');

  const validSkill = addSkillSchema.safeParse({
    skill_id: 201,
    proficiency_level: 'Advanced',
    years_experience: 2.5,
  });
  assert(validSkill.success === true, 'Accepts valid skill check values');

  const invalidProficiency = addSkillSchema.safeParse({
    skill_id: 201,
    proficiency_level: 'Godlike', // Not in CHECK constraint
    years_experience: 2.5,
  });
  assert(invalidProficiency.success === false, 'Rejects proficiency level outside CHECK constraint');

  const validProject = createProjectSchema.safeParse({
    project_id: 506,
    title: 'High Performance Database',
    max_students: 4,
    status: 'Open',
    client_id: 301,
    domain_id: 401,
  });
  assert(validProject.success === true, 'Validates valid project creation payload');

  const invalidMaxStudents = createProjectSchema.safeParse({
    project_id: 506,
    title: 'Bad Project',
    max_students: 0, // CHECK constraint max_students > 0
    status: 'Open',
    client_id: 301,
    domain_id: 401,
  });
  assert(invalidMaxStudents.success === false, 'Rejects project with max_students <= 0');

  const validSelection = selectCandidateSchema.safeParse({
    student_id: 101,
    project_id: 501,
    role: 'Lead Architect',
  });
  assert(validSelection.success === true, 'Validates selection parameters for stored procedure');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runTests();
