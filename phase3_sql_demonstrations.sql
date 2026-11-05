-- =============================================================================
-- STUDENT SKILL–PROJECT MATCHING SYSTEM
-- PHASE 3 SQL DEMONSTRATIONS SCRIPT
-- =============================================================================
-- File: phase3_sql_demonstrations.sql
-- Purpose: University DBMS Level 3 Evaluation & Live Demonstration Script
-- Database: student_skill_project_matching
--
-- Concepts Demonstrated:
--   Section 1: DDL Operations (CREATE, ALTER, and disposable DROP)
--   Section 2: Basic & Complex DML Operations (INSERT, SELECT, UPDATE, DELETE)
--   Section 3: SQL Relational Clauses (JOIN, GROUP BY, HAVING, ORDER BY)
--   Section 4: Aggregate Functions (COUNT, AVG, MAX, MIN)
--   Section 5: Advanced Subqueries (Scalar, Correlated, IN / NOT IN)
--   Section 6: Database Views (Student_Skill_Profile, Project_Applicants, Project_Match_Summary)
--   Section 7: Stored Procedures (Get_Project_Matches, Assert_Project_Has_Room)
--   Section 8: Database Triggers (Check_Application_Eligibility, Check_Project_Capacity)
--   Section 9: ACID Transactions with Row Locking (Select_Student_For_Project & ROLLBACK demos)
--   Section 10: Secondary Indexes & Performance
--
-- NOTE: All demonstrations use safe, repeatable SQL with transactions or
-- disposable test keys (e.g., student_id = 105, project_id = 504, skill_id = 202).
-- No existing baseline data is deleted or permanently corrupted.
-- =============================================================================

USE student_skill_project_matching;

-- =============================================================================
-- SECTION 1: DDL DEMONSTRATIONS (CREATE, ALTER, DROP)
-- Uses an isolated disposable table `TEMP_AUDIT_EXPERIMENT` to guarantee safety.
-- =============================================================================

-- 1.1 CREATE TABLE: Create an isolated demonstration table with integrity constraints
CREATE TABLE IF NOT EXISTS TEMP_AUDIT_EXPERIMENT (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    action_note VARCHAR(150) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_temp_audit_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.2 ALTER TABLE: Add an index and a new column with CHECK constraint
ALTER TABLE TEMP_AUDIT_EXPERIMENT
    ADD COLUMN severity_level VARCHAR(20) DEFAULT 'Info',
    ADD CONSTRAINT chk_temp_severity CHECK (severity_level IN ('Info', 'Warning', 'Critical'));

-- 1.3 DROP TABLE: Safely remove only the disposable demonstration table
DROP TABLE IF EXISTS TEMP_AUDIT_EXPERIMENT;


-- =============================================================================
-- SECTION 2: DML OPERATIONS (INSERT, SELECT, UPDATE, DELETE)
-- =============================================================================

-- 2.1 INSERT: Record a new student skill association in STUDENT_SKILL
-- (Using Student 105 and Skill 202 'Java' - repeatable with ON DUPLICATE KEY UPDATE)
INSERT INTO STUDENT_SKILL (student_id, skill_id, proficiency_level, years_experience)
VALUES (105, 202, 'Intermediate', 1.5)
ON DUPLICATE KEY UPDATE
    proficiency_level = VALUES(proficiency_level),
    years_experience = VALUES(years_experience);

-- 2.2 SELECT: Retrieve student academic details along with their department name
SELECT s.student_id, s.name, s.year, s.cgpa, d.dept_name
FROM STUDENT s
JOIN DEPARTMENT d ON d.dept_id = s.dept_id
WHERE s.student_id = 105;

-- 2.3 UPDATE: Update skill proficiency and years of experience (enforces CHECK constraint)
UPDATE STUDENT_SKILL
SET proficiency_level = 'Advanced', years_experience = 2.5
WHERE student_id = 105 AND skill_id = 202;

-- Verify update:
SELECT student_id, skill_id, proficiency_level, years_experience
FROM STUDENT_SKILL
WHERE student_id = 105 AND skill_id = 202;

-- 2.4 DELETE: Remove the demo skill association safely
DELETE FROM STUDENT_SKILL
WHERE student_id = 105 AND skill_id = 202;

-- 2.5 INSERT & UPDATE on APPLICATION
-- Safely insert a test application in a transaction and rollback or update status
START TRANSACTION;
INSERT INTO APPLICATION (student_id, project_id, application_date, status)
VALUES (105, 503, CURDATE(), 'Applied')
ON DUPLICATE KEY UPDATE status = 'Applied';

-- Update application status to Shortlisted:
UPDATE APPLICATION
SET status = 'Shortlisted'
WHERE student_id = 105 AND project_id = 503;

-- Rollback the demo application so original state is preserved:
ROLLBACK;


-- =============================================================================
-- SECTION 3: RELATIONAL CLAUSES (JOIN, GROUP BY, HAVING, ORDER BY)
-- =============================================================================

-- 3.1 Multi-Table JOIN: Join Students, Skills, and Skill Categories
SELECT s.student_id, s.name AS student_name, sk.skill_name,
       sc.category_name, ss.proficiency_level, ss.years_experience
FROM STUDENT s
JOIN STUDENT_SKILL ss ON ss.student_id = s.student_id
JOIN SKILL sk ON sk.skill_id = ss.skill_id
JOIN SKILL_CATEGORY sc ON sc.category_id = sk.category_id
ORDER BY s.student_id ASC, sk.skill_name ASC;

-- 3.2 GROUP BY: Total skills and average experience per student
SELECT s.student_id, s.name,
       COUNT(ss.skill_id) AS total_skills,
       ROUND(AVG(ss.years_experience), 2) AS avg_experience_years
FROM STUDENT s
LEFT JOIN STUDENT_SKILL ss ON ss.student_id = s.student_id
GROUP BY s.student_id, s.name
ORDER BY total_skills DESC;

-- 3.3 HAVING: Filter students possessing more than 2 skills
SELECT s.student_id, s.name, COUNT(ss.skill_id) AS skill_count
FROM STUDENT s
JOIN STUDENT_SKILL ss ON ss.student_id = s.student_id
GROUP BY s.student_id, s.name
HAVING COUNT(ss.skill_id) > 2
ORDER BY skill_count DESC;

-- 3.4 HAVING: Projects with multiple applicants (HAVING COUNT(*) > 1)
SELECT p.project_id, p.title, COUNT(a.student_id) AS applicant_count
FROM PROJECT p
JOIN APPLICATION a ON a.project_id = p.project_id
GROUP BY p.project_id, p.title
HAVING COUNT(a.student_id) > 1
ORDER BY applicant_count DESC;

-- 3.5 ORDER BY: Ranked project match results
SELECT student_id, project_id, match_score, status
FROM MATCH_RESULT
ORDER BY match_score DESC, student_id ASC;


-- =============================================================================
-- SECTION 4: AGGREGATE FUNCTIONS (COUNT, AVG, MAX, MIN)
-- =============================================================================

-- 4.1 System-wide project match statistics:
SELECT
    COUNT(*) AS total_matches,
    ROUND(AVG(match_score), 2) AS average_match_score,
    MAX(match_score) AS highest_match_score,
    MIN(match_score) AS lowest_match_score
FROM MATCH_RESULT;

-- 4.2 Aggregate statistics per project:
SELECT
    p.project_id,
    p.title,
    COUNT(mr.student_id) AS evaluated_candidates,
    ROUND(AVG(mr.match_score), 2) AS avg_score,
    MAX(mr.match_score) AS best_score
FROM PROJECT p
JOIN MATCH_RESULT mr ON mr.project_id = p.project_id
GROUP BY p.project_id, p.title
ORDER BY avg_score DESC;


-- =============================================================================
-- SECTION 5: ADVANCED SUBQUERIES
-- =============================================================================

-- 5.1 Subquery with Scalar Comparison:
-- Retrieve all match results that scored ABOVE the overall average match score
SELECT mr.student_id, s.name, mr.project_id, p.title, mr.match_score
FROM MATCH_RESULT mr
JOIN STUDENT s ON s.student_id = mr.student_id
JOIN PROJECT p ON p.project_id = mr.project_id
WHERE mr.match_score > (SELECT AVG(match_score) FROM MATCH_RESULT)
ORDER BY mr.match_score DESC;

-- 5.2 Subquery with IN / NOT IN:
-- Find students who have applied for at least one project but have NO active membership
SELECT s.student_id, s.name, d.dept_name
FROM STUDENT s
JOIN DEPARTMENT d ON d.dept_id = s.dept_id
WHERE s.student_id IN (SELECT student_id FROM APPLICATION)
  AND s.student_id NOT IN (
      SELECT student_id FROM PROJECT_MEMBER WHERE member_status = 'Active'
  );

-- 5.3 Correlated Subquery:
-- For each project, compute the number of active members and calculate remaining capacity
SELECT p.project_id, p.title, p.max_students,
       (SELECT COUNT(*) FROM PROJECT_MEMBER pm
        WHERE pm.project_id = p.project_id AND pm.member_status = 'Active') AS active_members,
       p.max_students - (SELECT COUNT(*) FROM PROJECT_MEMBER pm
        WHERE pm.project_id = p.project_id AND pm.member_status = 'Active') AS remaining_slots
FROM PROJECT p
ORDER BY remaining_slots ASC;


-- =============================================================================
-- SECTION 6: DATABASE VIEWS
-- =============================================================================

-- 6.1 View 1: Student_Skill_Profile (Multi-table LEFT JOIN view)
SELECT * FROM Student_Skill_Profile WHERE student_id = 101;

-- 6.2 View 2: Project_Applicants (Application status & academic standing view)
SELECT * FROM Project_Applicants WHERE project_id = 501;

-- 6.3 View 3: Project_Match_Summary (Precomputed match scores & skills view)
SELECT student_name, project_title, match_score, matched_skills, missing_skills, match_status
FROM Project_Match_Summary
ORDER BY match_score DESC;


-- =============================================================================
-- SECTION 7: STORED PROCEDURES
-- =============================================================================

-- 7.1 Stored Procedure: Get_Project_Matches
-- Returns ranked candidate matches for Project 501
CALL Get_Project_Matches(501);


-- =============================================================================
-- SECTION 8: DATABASE TRIGGERS
-- =============================================================================

-- 8.1 Trigger Test: Check_Application_Eligibility (BEFORE INSERT ON APPLICATION)
-- Attempting to apply for non-existent project (999) must be rejected with SQLSTATE 45000:
-- Expected error: 'Rejected: project does not exist'
-- (Uncomment to demonstrate live trigger rejection in terminal/MySQL workbench)
-- INSERT INTO APPLICATION (student_id, project_id, application_date, status)
-- VALUES (101, 999, CURDATE(), 'Applied');

-- 8.2 Trigger Test: Check_Project_Max_Students_Update (BEFORE UPDATE ON PROJECT)
-- Attempting to lower max_students below current active members (Project 501 has 1 active member):
-- Setting max_students = 0 fails with CHECK constraint, and lowering below active members
-- fires the trigger 'Update rejected: max_students is below the current active-member count'
-- (Uncomment to demonstrate trigger rejection)
-- UPDATE PROJECT SET max_students = 0 WHERE project_id = 501;


-- =============================================================================
-- SECTION 9: TRANSACTIONS WITH ROW LOCKING & ROLLBACK
-- =============================================================================

-- 9.1 Transaction Demonstration with ROLLBACK:
-- Safe test showing atomicity and rollback capability:
START TRANSACTION;
UPDATE APPLICATION
SET status = 'Shortlisted'
WHERE student_id = 103 AND project_id = 501;

-- Verify change is visible inside this transaction:
SELECT student_id, project_id, status FROM APPLICATION
WHERE student_id = 103 AND project_id = 501;

-- Rollback restores previous state:
ROLLBACK;

-- Verify change is undone:
SELECT student_id, project_id, status FROM APPLICATION
WHERE student_id = 103 AND project_id = 501;

-- 9.2 Transactional Stored Procedure: Select_Student_For_Project
-- Executes atomic SELECT ... FOR UPDATE, updates application, and inserts member:
-- CALL Select_Student_For_Project(102, 501, 'AI Specialist');


-- =============================================================================
-- SECTION 10: SECONDARY COMPOSITE INDEXES
-- =============================================================================

-- Verify existing composite indexes designed to optimize view and trigger queries:
SHOW INDEX FROM APPLICATION;
SHOW INDEX FROM PROJECT_MEMBER;
SHOW INDEX FROM MATCH_RESULT;
SHOW INDEX FROM APP_USER;

