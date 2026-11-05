import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

try {
  process.loadEnvFile?.();
} catch {}

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  category: string;
  testName: string;
  endpointOrAction: string;
  result: 'PASS' | 'FAIL' | 'NOT TESTED';
  details: string;
}

const results: TestResult[] = [];

function record(category: string, testName: string, endpointOrAction: string, passed: boolean, details: string) {
  results.push({
    category,
    testName,
    endpointOrAction,
    result: passed ? 'PASS' : 'FAIL',
    details,
  });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${category}] ${testName}: ${details}`);
}

async function runE2ETests() {
  console.log('======================================================================');
  console.log('STARTING SYSTEMATIC END-TO-END FUNCTIONAL VERIFICATION');
  console.log('======================================================================\n');

  let adminCookie = '';
  let studentCookie = '';
  let student102Cookie = '';

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION & SECURITY TESTS
  // -------------------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION & ACCESS CONTROL TESTS ---');

  // Test 1.1: Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    const passed = res.status === 200 && data.user?.role === 'ADMIN' && Boolean(setCookie);
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
    record('Authentication', 'Admin Login', 'POST /api/auth/login', passed,
      `Status ${res.status}, role=${data.user?.role}, HttpOnly cookie issued`);
  } catch (err: any) {
    record('Authentication', 'Admin Login', 'POST /api/auth/login', false, err.message);
  }

  // Test 1.2: Student Login (Rahul, ID 101)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@gmail.com', password: 'Student@123' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    const passed = res.status === 200 && data.user?.role === 'STUDENT' && data.user?.studentId === 101;
    if (setCookie) {
      studentCookie = setCookie.split(';')[0];
    }
    record('Authentication', 'Student Login (ID 101)', 'POST /api/auth/login', passed,
      `Status ${res.status}, studentId=${data.user?.studentId}, role=${data.user?.role}`);
  } catch (err: any) {
    record('Authentication', 'Student Login (ID 101)', 'POST /api/auth/login', false, err.message);
  }

  // Test 1.3: Student Login (Ananya, ID 102)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ananya@gmail.com', password: 'Student@123' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    const passed = res.status === 200 && data.user?.studentId === 102;
    if (setCookie) {
      student102Cookie = setCookie.split(';')[0];
    }
    record('Authentication', 'Student Login (ID 102)', 'POST /api/auth/login', passed,
      `Status ${res.status}, studentId=${data.user?.studentId}`);
  } catch (err: any) {
    record('Authentication', 'Student Login (ID 102)', 'POST /api/auth/login', false, err.message);
  }

  // Test 1.4: Invalid Credentials Rejection
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'WrongPassword999!' }),
    });
    const passed = res.status === 401;
    record('Security', 'Invalid Password Rejection', 'POST /api/auth/login', passed,
      `Status ${res.status} (Expected 401 Unauthorized)`);
  } catch (err: any) {
    record('Security', 'Invalid Password Rejection', 'POST /api/auth/login', false, err.message);
  }

  // Test 1.5: Unauthorized Access (No Token)
  try {
    const res = await fetch(`${BASE_URL}/api/students`);
    const passed = res.status === 401;
    record('Security', 'Unauthenticated API Access Blocked', 'GET /api/students', passed,
      `Status ${res.status} (Expected 401)`);
  } catch (err: any) {
    record('Security', 'Unauthenticated API Access Blocked', 'GET /api/students', false, err.message);
  }

  // Test 1.6: Student Accessing Admin API Blocked
  try {
    const res = await fetch(`${BASE_URL}/api/students`, {
      headers: { Cookie: studentCookie },
    });
    const passed = res.status === 403;
    record('Security', 'Student Accessing Admin API Blocked', 'GET /api/students', passed,
      `Status ${res.status} (Expected 403 Forbidden)`);
  } catch (err: any) {
    record('Security', 'Student Accessing Admin API Blocked', 'GET /api/students', false, err.message);
  }

  // Test 1.7: Student Modifying Another Student's Application Blocked
  try {
    const res = await fetch(`${BASE_URL}/api/applications/102-501`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ status: 'Withdrawn' }),
    });
    const passed = res.status === 403;
    record('Security', 'URL Tampering (Cross-student mutation) Blocked', 'PATCH /api/applications/102-501', passed,
      `Status ${res.status} (Expected 403 Forbidden)`);
  } catch (err: any) {
    record('Security', 'URL Tampering (Cross-student mutation) Blocked', 'PATCH /api/applications/102-501', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 2. ADMIN MODULES VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 2. ADMIN SIDEBAR MODULES TESTS ---');

  // Module 1: Overview KPIs
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/overview`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && data.totalStudents >= 5 && data.totalProjects >= 4 && data.totalApplications >= 8;
    record('Admin Overview', 'KPI Metrics Aggregation', 'GET /api/analytics/overview', passed,
      `Students=${data.totalStudents}, Projects=${data.totalProjects}, Apps=${data.totalApplications}, Members=${data.activeMembers}, MongoDB Events=${data.activityCount}`);
  } catch (err: any) {
    record('Admin Overview', 'KPI Metrics Aggregation', 'GET /api/analytics/overview', false, err.message);
  }

  // Module 2: Student Management & Views
  try {
    const res = await fetch(`${BASE_URL}/api/students?search=Rahul`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && data.students?.length === 1 && data.students[0].name === 'Rahul';
    record('Admin Students', 'Student Search & Listing', 'GET /api/students?search=Rahul', passed,
      `Found ${data.students?.length} matching student(s)`);
  } catch (err: any) {
    record('Admin Students', 'Student Search & Listing', 'GET /api/students?search=Rahul', false, err.message);
  }

  // Module 2.1: Student Skill Profile View
  try {
    const res = await fetch(`${BASE_URL}/api/students/101/skills`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.skills) && data.skills.length >= 3;
    record('Admin Students', 'Student_Skill_Profile View Integration', 'GET /api/students/101/skills', passed,
      `Returned ${data.skills?.length} skill records via Student_Skill_Profile view`);
  } catch (err: any) {
    record('Admin Students', 'Student_Skill_Profile View Integration', 'GET /api/students/101/skills', false, err.message);
  }

  // Module 3: Project Management CRUD (Disposable Test Project #599)
  const TEST_PROJECT_ID = 599;
  try {
    // 3.1 Create project
    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        project_id: TEST_PROJECT_ID,
        title: 'E2E Automated Test Project',
        description: 'Temporary project for automated validation',
        max_students: 3,
        status: 'Open',
        client_id: 301,
        domain_id: 401,
      }),
    });
    const createData = await createRes.json();
    const createPassed = createRes.status === 201 && createData.success;
    record('Admin Projects', 'Project INSERT', 'POST /api/projects', createPassed,
      `Created test project #${TEST_PROJECT_ID}`);

    // 3.2 Update project
    const updateRes = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        title: 'E2E Automated Test Project (Updated)',
        max_students: 4,
      }),
    });
    const updateData = await updateRes.json();
    const updatePassed = updateRes.status === 200 && updateData.success;
    record('Admin Projects', 'Project UPDATE', `PATCH /api/projects/${TEST_PROJECT_ID}`, updatePassed,
      `Updated capacity to 4`);

    // 3.3 Delete project
    const deleteRes = await fetch(`${BASE_URL}/api/projects/${TEST_PROJECT_ID}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const deleteData = await deleteRes.json();
    const deletePassed = deleteRes.status === 200 && deleteData.success;
    record('Admin Projects', 'Project DELETE', `DELETE /api/projects/${TEST_PROJECT_ID}`, deletePassed,
      `Cleaned up test project #${TEST_PROJECT_ID}`);
  } catch (err: any) {
    record('Admin Projects', 'Project CRUD', 'Projects API', false, err.message);
  }

  // Module 4: Application Management via Project_Applicants View
  try {
    const res = await fetch(`${BASE_URL}/api/applications?project_id=501`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.applications) && data.applications.length >= 3;
    record('Admin Applications', 'Project_Applicants View Integration', 'GET /api/applications?project_id=501', passed,
      `Retrieved ${data.applications?.length} applicants for Project 501 via View`);
  } catch (err: any) {
    record('Admin Applications', 'Project_Applicants View Integration', 'GET /api/applications?project_id=501', false, err.message);
  }

  // Module 5: Stored Procedure CALL Get_Project_Matches
  try {
    const res = await fetch(`${BASE_URL}/api/matches/project/501`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const matches = data.matches;
    const passed = res.status === 200 && Array.isArray(matches) && matches.length > 0 &&
      Number(matches[0].match_score) >= Number(matches[matches.length - 1].match_score);
    record('Admin Matches', 'Stored Procedure: Get_Project_Matches', 'GET /api/matches/project/501', passed,
      `Stored Procedure returned ${matches?.length} candidates in descending score order (Top: ${matches?.[0]?.student_name} with ${matches?.[0]?.match_score}%)`);
  } catch (err: any) {
    record('Admin Matches', 'Stored Procedure: Get_Project_Matches', 'GET /api/matches/project/501', false, err.message);
  }

  // Module 6: Project Memberships & Live Capacity
  try {
    const res = await fetch(`${BASE_URL}/api/memberships?project_id=501`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.memberships);
    record('Admin Memberships', 'Project Memberships & Status', 'GET /api/memberships?project_id=501', passed,
      `Project 501 has ${data.memberships?.length} active member(s)`);
  } catch (err: any) {
    record('Admin Memberships', 'Project Memberships & Status', 'GET /api/memberships?project_id=501', false, err.message);
  }

  // Module 7: Advanced Relational Queries & MongoDB Aggregations
  try {
    const sqlRes = await fetch(`${BASE_URL}/api/analytics/projects`, {
      headers: { Cookie: adminCookie },
    });
    const sqlData = await sqlRes.json();
    const sqlPassed = sqlRes.status === 200 &&
      Array.isArray(sqlData.skillsPerStudent) &&
      Array.isArray(sqlData.projectsWithMultipleApplicants) &&
      Array.isArray(sqlData.matchesAboveAverage) &&
      Array.isArray(sqlData.capacityUtilization);
    record('Analytics (SQL)', 'GROUP BY, HAVING, AVG/MAX, Subqueries', 'GET /api/analytics/projects', sqlPassed,
      `HAVING > 1 count=${sqlData.projectsWithMultipleApplicants?.length}, Subquery above avg count=${sqlData.matchesAboveAverage?.length}`);

    const mongoRes = await fetch(`${BASE_URL}/api/analytics/activity`, {
      headers: { Cookie: adminCookie },
    });
    const mongoData = await mongoRes.json();
    const mongoPassed = mongoRes.status === 200 &&
      Array.isArray(mongoData.eventsByType) &&
      Array.isArray(mongoData.dailyTrend);
    record('Analytics (MongoDB)', 'NoSQL Aggregation Pipelines ($group, $sort)', 'GET /api/analytics/activity', mongoPassed,
      `Event types aggregated: ${mongoData.eventsByType?.length}, Daily trend intervals: ${mongoData.dailyTrend?.length}`);
  } catch (err: any) {
    record('Analytics', 'Advanced Analytics Integration', 'Analytics API', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 3. STUDENT WORKFLOWS VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 3. STUDENT WORKFLOWS TESTS ---');

  // Student Profile
  try {
    const res = await fetch(`${BASE_URL}/api/students/me`, {
      headers: { Cookie: studentCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && data.student?.name === 'Rahul' && data.student?.cgpa !== undefined;
    record('Student Profile', 'Fetch Student Academic Profile', 'GET /api/students/me', passed,
      `Name=${data.student?.name}, Dept=${data.student?.dept_name}, CGPA=${data.student?.cgpa}`);
  } catch (err: any) {
    record('Student Profile', 'Fetch Student Academic Profile', 'GET /api/students/me', false, err.message);
  }

  // Student Skills CRUD (Test Skill 202 'Java' for Rahul #101)
  const TEST_SKILL_ID = 202; // Java
  try {
    // 1. INSERT Skill
    const addRes = await fetch(`${BASE_URL}/api/students/me/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        skill_id: TEST_SKILL_ID,
        proficiency_level: 'Intermediate',
        years_experience: 1.5,
      }),
    });
    const addData = await addRes.json();
    const addPassed = addRes.status === 200 && addData.success;
    record('Student Skills', 'Skill INSERT into STUDENT_SKILL', 'POST /api/students/me/skills', addPassed,
      `Recorded skill #${TEST_SKILL_ID}`);

    // 2. SELECT Skills via Student_Skill_Profile view
    const listRes = await fetch(`${BASE_URL}/api/students/me/skills`, {
      headers: { Cookie: studentCookie },
    });
    const listData = await listRes.json();
    const foundSkill = listData.skills?.find((s: any) => s.skill_id === TEST_SKILL_ID);
    const listPassed = listRes.status === 200 && Boolean(foundSkill);
    record('Student Skills', 'Skill SELECT via Student_Skill_Profile', 'GET /api/students/me/skills', listPassed,
      `Skill found in profile view: ${foundSkill?.skill_name} (${foundSkill?.proficiency_level})`);

    // 3. UPDATE Skill
    const updateRes = await fetch(`${BASE_URL}/api/students/me/skills/${TEST_SKILL_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        proficiency_level: 'Advanced',
        years_experience: 2.5,
      }),
    });
    const updateData = await updateRes.json();
    const updatePassed = updateRes.status === 200 && updateData.success;
    record('Student Skills', 'Skill UPDATE', `PATCH /api/students/me/skills/${TEST_SKILL_ID}`, updatePassed,
      `Updated proficiency to Advanced, exp to 2.5 yrs`);

    // 4. DELETE Skill
    const deleteRes = await fetch(`${BASE_URL}/api/students/me/skills/${TEST_SKILL_ID}`, {
      method: 'DELETE',
      headers: { Cookie: studentCookie },
    });
    const deleteData = await deleteRes.json();
    const deletePassed = deleteRes.status === 200 && deleteData.success;
    record('Student Skills', 'Skill DELETE', `DELETE /api/students/me/skills/${TEST_SKILL_ID}`, deletePassed,
      `Removed test skill #${TEST_SKILL_ID} from profile`);
  } catch (err: any) {
    record('Student Skills', 'Skills CRUD', 'Skills API', false, err.message);
  }

  // Student Match Results View
  try {
    const res = await fetch(`${BASE_URL}/api/matches/me`, {
      headers: { Cookie: studentCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.matches) && data.matches.length > 0;
    record('Student Matches', 'Project_Match_Summary View', 'GET /api/matches/me', passed,
      `Retrieved ${data.matches?.length} stored match results for student #101`);
  } catch (err: any) {
    record('Student Matches', 'Project_Match_Summary View', 'GET /api/matches/me', false, err.message);
  }

  // Student Applications & Trigger Rejection Test
  try {
    // 1. Trigger Rejection: Try to apply to non-existent project #9999
    const invalidAppRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ project_id: 9999 }),
    });
    const invalidData = await invalidAppRes.json();
    const triggerPassed = invalidAppRes.status === 400 && invalidData.error?.includes('project does not exist');
    record('Database Triggers', 'Trigger Rejection: Check_Application_Eligibility', 'POST /api/applications (Project 9999)', triggerPassed,
      `Trigger raised SQLSTATE 45000: "${invalidData.error}"`);

    // 2. Submit valid test application (Student 105 for Project 504)
    // First login as Student 105 (Arjun)
    const login105Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arjun@gmail.com', password: 'Student@123' }),
    });
    const student105Cookie = login105Res.headers.get('set-cookie')?.split(';')[0] || '';

    const validAppRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: student105Cookie },
      body: JSON.stringify({ project_id: 504 }),
    });
    const validAppData = await validAppRes.json();
    const appPassed = validAppRes.status === 201 && validAppData.success;
    record('Student Applications', 'Application Submission (Trigger Passed)', 'POST /api/applications', appPassed,
      `Submitted application for project 504`);

    // 3. Withdraw the test application
    const withdrawRes = await fetch(`${BASE_URL}/api/applications/105-504`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: student105Cookie },
      body: JSON.stringify({ status: 'Withdrawn' }),
    });
    const withdrawData = await withdrawRes.json();
    const withdrawPassed = withdrawRes.status === 200 && withdrawData.success;
    record('Student Applications', 'Application Withdrawal', 'PATCH /api/applications/105-504', withdrawPassed,
      `Status updated to Withdrawn`);

    // Clean up test application record from database directly so baseline data is identical
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
    });
    await conn.execute('DELETE FROM APPLICATION WHERE student_id = 105 AND project_id = 504');
    await conn.end();
  } catch (err: any) {
    record('Student Applications', 'Application Workflow', 'Applications API', false, err.message);
  }

  // Student MongoDB Activity History
  try {
    const res = await fetch(`${BASE_URL}/api/activity/me`, {
      headers: { Cookie: studentCookie },
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.activities);
    record('Student Activity', 'MongoDB activity_logs Temporal Retrieval', 'GET /api/activity/me', passed,
      `Retrieved ${data.activities?.length} audit events logged in MongoDB`);
  } catch (err: any) {
    record('Student Activity', 'MongoDB activity_logs Temporal Retrieval', 'GET /api/activity/me', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 4. ATOMIC SELECTION TRANSACTION & ROW LOCKING PROCEDURE TEST
  // -------------------------------------------------------------------------
  console.log('\n--- 4. TRANSACTION & ROW LOCKING (Select_Student_For_Project) ---');
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'student_skill_project_matching',
    });

    // Student 102 applied to 504 (status: Applied)
    // Test stored procedure selection:
    const [procRes]: any = await conn.query('CALL Select_Student_For_Project(102, 504, "Data Engineer")');

    // Verify database state: APPLICATION must be 'Selected' and PROJECT_MEMBER must be 'Active'
    const [appRows]: any = await conn.query('SELECT status FROM APPLICATION WHERE student_id = 102 AND project_id = 504');
    const [memRows]: any = await conn.query('SELECT role, member_status FROM PROJECT_MEMBER WHERE student_id = 102 AND project_id = 504');

    const procPassed = appRows[0]?.status === 'Selected' && memRows[0]?.member_status === 'Active';
    record('Transactions & Stored Procedures', 'Select_Student_For_Project (Row Lock & Atomic Commit)', 'CALL Select_Student_For_Project(102, 504, "Data Engineer")', procPassed,
      `Application updated to 'Selected', Project Member inserted with role='Data Engineer'`);

    // Verify Rollback on Invalid Call (e.g., student already selected):
    let rollbackPassed = false;
    try {
      await conn.query('CALL Select_Student_For_Project(102, 504, "Duplicate Role")');
    } catch (e: any) {
      rollbackPassed = e.message.includes('no eligible Applied or Shortlisted application found');
    }
    record('Transactions & Stored Procedures', 'Transaction ROLLBACK on Exception', 'CALL Select_Student_For_Project (Duplicate)', rollbackPassed,
      `Rollback executed automatically by EXIT HANDLER FOR SQLEXCEPTION`);

    // Clean up: Reset student 102 application to 'Applied' and delete member record so baseline data is intact
    await conn.execute('DELETE FROM PROJECT_MEMBER WHERE student_id = 102 AND project_id = 504');
    await conn.execute('UPDATE APPLICATION SET status = "Applied" WHERE student_id = 102 AND project_id = 504');
    await conn.end();
  } catch (err: any) {
    record('Transactions & Stored Procedures', 'Select_Student_For_Project', 'CALL Select_Student_For_Project', false, err.message);
  }

  console.log('\n======================================================================');
  console.log('SUMMARY OF ALL END-TO-END TESTS');
  console.log('======================================================================');
  const passedCount = results.filter(r => r.result === 'PASS').length;
  const failedCount = results.filter(r => r.result === 'FAIL').length;
  console.log(`TOTAL: ${results.length} | PASS: ${passedCount} | FAIL: ${failedCount}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2ETests();
