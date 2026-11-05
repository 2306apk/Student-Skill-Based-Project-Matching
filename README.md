# Student Skill–Project Matching System
### DBMS Experiential Learning — Level 3 Project (Phase 3 Full-Stack Implementation)
**PES University • Department of Computer Science & Engineering**

---

## 1. Project Introduction & Problem Statement

In academic and enterprise research institutions, allocating capstone and research projects to students traditionally suffers from manual bias, capacity race conditions, lack of skill verification, and uncoordinated application workflows. 

The **Student Skill–Project Matching System** addresses this problem by delivering a robust dual-database web application where:
- Students maintain verified academic and skill profiles, browse open industry projects, view precomputed algorithmic match scores, submit applications, and track assignment status.
- Administrators review applicants, inspect ranked candidates via database stored procedures, enforce strict capacity constraints using triggers, and execute atomic student selection workflows with row-level transaction locking.
- A secondary NoSQL database records an immutable audit stream of all student and project lifecycle events for analytical aggregation and timeline tracking.

---

## 2. Dual-Database System Architecture

The application adopts a **hybrid polyglot persistence architecture**:

```
+-----------------------------------------------------------------------------------+
|                           Next.js 14 App Router UI                                |
|          (TypeScript, Tailwind CSS, Recharts, Lucide Icons, Zod Validation)        |
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTP / Secure HttpOnly JWT Session
                                          |
+-----------------------------------------v-----------------------------------------+
|                       Next.js Server API Route Handlers                           |
|      (/api/auth, /api/students, /api/projects, /api/applications, /api/analytics) |
+--------------------+---------------------------------------------+----------------+
                     |                                             |
          mysql2 connection pool                        Official MongoDB Driver
                     |                                             |
+--------------------v--------------------+   +--------------------v----------------+
|       Primary Relational DB (MySQL)     |   |       Secondary NoSQL DB (MongoDB)  |
|   Database: student_skill_project_matching|   |   Collection: activity_logs         |
|-----------------------------------------|   |-------------------------------------|
| * 13 Base Tables + APP_USER Auth Table  |   | * Event Stream (Logins, Applies,    |
| * Views (Student_Skill_Profile, etc.)   |   |   Selections, Project/Skill Edits)  |
| * Stored Procedures (Get_Project_Matches|   | * Aggregation Pipelines:            |
|   and Select_Student_For_Project)       |   |   - $group by eventType             |
| * Triggers (Eligibility, Capacity checks|   |   - $group by projectId             |
| * Transactions with SELECT FOR UPDATE   |   |   - Daily activity timeline trends  |
| * Foreign Key & CHECK Constraints       |   | * Indexed on studentId, projectId,  |
| * Secondary Composite Indexes           |   |   eventType, timestamp              |
+-----------------------------------------+   +-------------------------------------+
```

### Why MySQL? (Primary Source of Truth)
- **ACID Transaction Guarantees:** Student project selection requires strict atomicity—updating the application to `Selected` and inserting an active `PROJECT_MEMBER` must either both succeed or both fail.
- **Relational Integrity & Normalization:** Manages normalized 3NF entities (`STUDENT`, `PROJECT`, `CLIENT`, `SKILL`, `APPLICATION`) with strict foreign keys, cascading deletes, and check constraints (`cgpa BETWEEN 0 AND 10`, `max_students > 0`, proficiency levels).
- **In-Database Business Rules:** Implements views, stored procedures, row locking (`FOR UPDATE`), and triggers directly in the database engine to prevent race conditions.

### Why MongoDB? (Secondary NoSQL Store)
- **Flexible Schema Audit Logging:** Real-world event payloads vary wildly (skill additions contain experience levels; project edits contain title/dates; selections contain roles). MongoDB's schemaless documents accommodate varying metadata without schema migrations.
- **High-Throughput Temporal Logging:** Activity events are written asynchronously without degrading relational transaction locks.
- **Aggregation Pipelines:** Executes multi-stage pipelines (`$match`, `$project`, `$substr`, `$group`, `$sort`) for operational analytics and daily trends.

---

## 3. Advanced Database Concepts Implemented

The application integrates at least **six advanced database concepts** directly executed against MySQL and MongoDB:

### 1. Database Views
- `Student_Skill_Profile`: Performs multi-table `LEFT JOIN` operations across `STUDENT`, `DEPARTMENT`, `STUDENT_SKILL`, `SKILL`, and `SKILL_CATEGORY` so students without recorded skills still appear. Used on Student and Admin profile views.
- `Project_Applicants`: Joins `APPLICATION`, `STUDENT`, and `PROJECT` to present application dates, student CGPA, and project statuses. Used in Application Management.
- `Project_Match_Summary`: Joins `MATCH_RESULT`, `STUDENT`, and `PROJECT` to expose matched skills, missing skills, and match scores.

### 2. Stored Procedures
- `Get_Project_Matches(IN p_project_id INT)`: Retrieves ranked candidate results for a given project ordered by `match_score DESC, student_id ASC, result_no ASC`.
- `Assert_Project_Has_Room(IN p_project_id, IN p_context, IN p_check_open, IN p_check_capacity)`: Shared verification procedure that acquires a row-level lock (`FOR UPDATE`) on the project, validates that the project exists, verifies status is `'Open'`, counts active members from `PROJECT_MEMBER`, and ensures capacity has not been breached.

### 3. Triggers
- `Check_Application_Eligibility` (`BEFORE INSERT ON APPLICATION`): Invokes `Assert_Project_Has_Room` to ensure no student can apply to a closed, full, or non-existent project.
- `Check_Project_Capacity` (`BEFORE INSERT ON PROJECT_MEMBER`): Prevents inserting active project members beyond `max_students`.
- `Check_Member_Update_Capacity` (`BEFORE UPDATE ON PROJECT_MEMBER`): Ensures capacity is not violated when reactivating an inactive member or transferring projects.
- `Check_Project_Max_Students_Update` (`BEFORE UPDATE ON PROJECT`): Prevents administrators from reducing `max_students` below the current active member count.

### 4. Transactions with Row-Level Locking (`SELECT FOR UPDATE`)
- Implemented inside `Select_Student_For_Project(IN p_student_id, IN p_project_id, IN p_role)`.
- Acquires an exclusive row lock on `PROJECT` via `FOR UPDATE` so concurrent selections cannot oversubscribe the final slot.
- Updates `APPLICATION.status = 'Selected'`.
- Inserts `PROJECT_MEMBER` record with `member_status = 'Active'`.
- Includes an `EXIT HANDLER FOR SQLEXCEPTION` that executes `ROLLBACK` and `RESIGNAL` on any trigger rejection or failure.

### 5. Advanced SQL Queries
- **GROUP BY and Aggregate Functions:** Aggregates skills per student with `COUNT(skill_id)` and `AVG(years_experience)`.
- **HAVING Clause:** Filters projects with multiple applicants using `HAVING COUNT(*) > 1`.
- **Subqueries:** Filters candidate matches exceeding the global average using `WHERE match_score > (SELECT AVG(match_score) FROM MATCH_RESULT)`.
- **Relational Capacity Calculation:** `LEFT JOIN` between `PROJECT` and `PROJECT_MEMBER` calculating `slots_left = p.max_students - COUNT(pm.student_id)`.

### 6. MongoDB Aggregation Pipelines
- **Event Breakdown:** `$group` by `eventType` with `$sum: 1` and `$sort` by frequency.
- **Project Activity Breakdown:** `$match` on valid project IDs, `$group` by `projectId` with `$push` of event timestamps.
- **Daily Timeline Trend:** `$project` with `$substr` on ISO timestamp strings and `$group` by date string.

---

## 4. Authentication, Roles & Security

- **Database-Level Credentials:** Stored in the additive `APP_USER` table with foreign key to `STUDENT(student_id)` and check constraint `CHECK (role IN ('STUDENT', 'ADMIN'))`.
- **Password Security:** Salted and hashed using `bcryptjs` with 10 rounds. No plaintext passwords stored.
- **Session Management:** Secure HttpOnly, SameSite=Lax JWT cookies signed with `jose` using HS256 and 24-hour expiration.
- **Authorization Enforcement:** Enforced in backend API route handlers (`requireAuth(['ADMIN'])` or `verifyStudentAccess`). Prevents URL tampering where students attempt to read or modify other students' profiles or applications.

---

## 5. Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS (Navy / Slate academic palette)
- **Relational Database:** MySQL 8.4 (`mysql2/promise` connection pool)
- **NoSQL Database:** MongoDB 7.0 (Official Node.js driver)
- **Validation:** Zod
- **Authentication:** `jose` (JWT) + `bcryptjs` (Password Hashing)
- **Visualization:** Recharts
- **Icons:** Lucide React

---

## 6. Project Structure

```
DBMS_Proj/
├── app/
│   ├── admin/
│   │   ├── analytics/page.tsx      # SQL aggregates & MongoDB charts
│   │   ├── applications/page.tsx   # Shortlist & select applicants
│   │   ├── dashboard/page.tsx      # Admin KPI overview
│   │   ├── layout.tsx              # Admin role protection & sidebar
│   │   ├── matches/page.tsx        # CALL Get_Project_Matches(?) (SP)
│   │   ├── memberships/page.tsx    # Project capacity & active members
│   │   ├── projects/page.tsx       # Create/edit/delete projects
│   │   └── students/page.tsx       # Search students & skill profiles
│   ├── api/
│   │   ├── activity/me/route.ts    # Student MongoDB audit log
│   │   ├── analytics/              # Overview, projects, activity
│   │   ├── applications/           # Submit & update application status
│   │   ├── auth/                   # login, logout, me
│   │   ├── matches/                # SP match queries
│   │   ├── memberships/            # Member listing & atomic selection
│   │   ├── metadata/               # Catalogs (skills, clients, domains)
│   │   ├── projects/               # CRUD with capacity checks
│   │   └── students/               # Profile & skill management
│   ├── login/page.tsx              # Role-aware authentication
│   ├── student/
│   │   ├── activity/page.tsx       # Student MongoDB events
│   │   ├── applications/page.tsx   # View & withdraw applications
│   │   ├── dashboard/page.tsx      # Student KPI overview
│   │   ├── layout.tsx              # Student role protection & sidebar
│   │   ├── matches/page.tsx        # View Project_Match_Summary view
│   │   ├── my-projects/page.tsx    # View project memberships
│   │   ├── profile/page.tsx        # Academic profile from STUDENT table
│   │   ├── projects/page.tsx       # Browse open projects & apply
│   │   └── skills/page.tsx         # Manage skills in STUDENT_SKILL
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Role-based redirect
├── components/
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── StudentSidebar.tsx
│   └── ui/
│       ├── Modal.tsx
│       └── StatusBadge.tsx
├── lib/
│   ├── auth/                       # JWT tokens & server session helpers
│   ├── mongodb/client.ts           # Mongo connection & aggregation pipelines
│   ├── mysql/client.ts             # Connection pool & trigger error parser
│   └── validation/schemas.ts       # Zod schemas
├── migrations/
│   └── 001_create_app_user.sql     # Additive auth table migration
├── scripts/
│   ├── migrate.ts                  # Applies additive SQL migration
│   ├── seed.ts                     # Seeds hashed demo accounts
│   └── test-db.ts                  # Tests MySQL & Mongo connections
├── tests/
│   └── business-rules.test.ts      # Automated unit & rule test suite
├── types/index.ts                  # Shared TypeScript interfaces
├── .env.example
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. Setup & Execution Instructions

### A. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update credentials in `.env`:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=student_skill_project_matching

MONGODB_URI=mongodb://127.0.0.1:27017/student_skill_project_matching
MONGODB_DB=student_skill_project_matching

JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_for_security
```

### B. Database Initialization
1. If not already loaded, initialize the base schema:
```bash
mysql -u root -p < "student_skill_project_matching (4).sql"
```
2. Run the additive migration for the authentication table:
```bash
npm run db:migrate
```
3. Seed the hashed authentication accounts:
```bash
npm run db:seed
```

### C. Demo Accounts
| Role | Email | Password | Student ID |
|---|---|---|---|
| **Admin** | `admin@college.edu` | `Admin@123` | N/A |
| **Student** | `rahul@gmail.com` | `Student@123` | 101 |
| **Student** | `ananya@gmail.com` | `Student@123` | 102 |
| **Student** | `sneha@gmail.com` | `Student@123` | 104 |

### D. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### E. Running Automated Tests & Verification
```bash
npx tsx tests/business-rules.test.ts
npm run test:db
npm run build
```

---

## 8. Team Member Contributions

| Team Member | SRN | Core Contributions |
|---|---|---|
| **Apoorva Kogta** | `PES2UG24CS078` | - Designed and tuned advanced SQL stored procedures (`Get_Project_Matches`, `Assert_Project_Has_Room`) and trigger logic (`Check_Application_Eligibility`, `Check_Project_Capacity`).<br>- Implemented row-level transactional locking (`SELECT FOR UPDATE`) in student selection.<br>- Developed Next.js backend API routes (`/api/applications`, `/api/matches`, `/api/memberships`).<br>- Authored Zod input validation and SQL error formatting utilities.<br>- Implemented automated business-rules testing suite. |
| **Arayana Jain** | `PES2UG24CS051` | - Designed relational schema normalization and additive migration for `APP_USER` table.<br>- Configured MongoDB secondary NoSQL database connection, indexing, and aggregation pipelines (`getEventCountsByType`, `getDailyActivityTrend`).<br>- Developed role-based authentication with `jose` (JWT) and `bcryptjs`.<br>- Built frontend Student and Admin dashboards with Tailwind CSS and Recharts visualizations.<br>- Integrated database views (`Student_Skill_Profile`, `Project_Applicants`, `Project_Match_Summary`) with UI components. |

---

## 9. Known Limitations & Architectural Notes

1. **Decoupled Dual-Database Consistency:** MySQL transactions guarantee ACID atomicity for core relational entities. MongoDB activity logging is decoupled; if MongoDB is temporarily unreachable, the core MySQL operation still succeeds and logs a console warning, preventing audit downtime from blocking user transactions.
2. **Match Score Origin:** The `MATCH_RESULT` table stores evaluated algorithmic match scores. The frontend faithfully displays these stored relational values rather than simulating client-side match calculation.
3. **Database Trigger Execution:** Because triggers enforce constraints on `INSERT` and `UPDATE`, client-side forms surface trigger exceptions as user-friendly notifications (e.g. "Application rejected: project has reached active-member capacity").

