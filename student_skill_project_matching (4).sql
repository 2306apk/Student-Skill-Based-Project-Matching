-- ================================================================
-- STUDENT SKILL–PROJECT MATCHING SYSTEM
-- Complete MySQL script: database + schema + sample data + 4 DBMS concepts
--
-- Concepts demonstrated : Views, Stored Procedures, Triggers, Transactions
-- Extra                 : status CHECK constraints, row locking, indexes
-- Target                : MySQL 8.0.16+ (CHECK constraints are enforced from 8.0.16)
--
-- HOW TO RUN: mysql -u root -p < student_skill_project_matching.sql
--
-- WARNING: This script DROPS and recreates the database below.
-- Any existing data in student_skill_project_matching will be deleted.
-- Back up your database first if you need to preserve it.
--
-- FIXES INCLUDED IN THIS VERSION
--  1. Capacity race condition: the project row is locked (FOR UPDATE)
--     before active members are counted, so two concurrent selections
--     cannot both take the last slot.
--  2. Capacity is now also enforced on UPDATE (re-activating a member,
--     moving a member to another project, lowering max_students).
--  3. Status columns are restricted with CHECK constraints (no typos).
--  4. Duplicate trigger logic moved into one helper procedure.
--  5. Clear "project does not exist" error instead of "invalid capacity".
--  6. Student_Skill_Profile uses LEFT JOINs so students without skills
--     are still listed.
--  NOTE: matched_skills / missing_skills stay as text because they are
--  precomputed display values for each match result, not a place to
--  query individual skills (use STUDENT_SKILL / PROJECT_SKILL for that).
-- ================================================================

DROP DATABASE IF EXISTS student_skill_project_matching;
CREATE DATABASE student_skill_project_matching
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE student_skill_project_matching;

-- ================================================================
-- PART A: TABLE CREATION
-- ================================================================

CREATE TABLE DEPARTMENT (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE STUDENT (
    student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    cgpa DECIMAL(3,2),
    dept_id INT NOT NULL,
    supervisor_id INT NULL,
    CONSTRAINT fk_student_department
        FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id),
    CONSTRAINT fk_student_supervisor
        FOREIGN KEY (supervisor_id) REFERENCES STUDENT(student_id),
    CONSTRAINT chk_student_year CHECK (year BETWEEN 1 AND 4),
    CONSTRAINT chk_student_cgpa CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10)
) ENGINE=InnoDB;

CREATE TABLE STUDENT_EMAIL (
    student_id INT NOT NULL,
    email VARCHAR(150) NOT NULL,
    PRIMARY KEY (student_id, email),
    CONSTRAINT fk_student_email_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE SKILL_CATEGORY (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE SKILL (
    skill_id INT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    CONSTRAINT fk_skill_category
        FOREIGN KEY (category_id) REFERENCES SKILL_CATEGORY(category_id)
) ENGINE=InnoDB;

CREATE TABLE STUDENT_SKILL (
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL,
    years_experience DECIMAL(4,1) NOT NULL DEFAULT 0,
    PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_student_skill_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_student_skill_skill
        FOREIGN KEY (skill_id) REFERENCES SKILL(skill_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_student_skill_experience CHECK (years_experience >= 0),
    CONSTRAINT chk_student_skill_level CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'))
) ENGINE=InnoDB;

CREATE TABLE CLIENT (
    client_id INT PRIMARY KEY,
    org_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    industry VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE CLIENT_EMAIL (
    client_id INT NOT NULL,
    email VARCHAR(150) NOT NULL,
    PRIMARY KEY (client_id, email),
    CONSTRAINT fk_client_email_client
        FOREIGN KEY (client_id) REFERENCES CLIENT(client_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DOMAIN (
    domain_id INT PRIMARY KEY,
    domain_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE PROJECT (
    project_id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    max_students INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    client_id INT NOT NULL,
    domain_id INT NOT NULL,
    CONSTRAINT fk_project_client
        FOREIGN KEY (client_id) REFERENCES CLIENT(client_id),
    CONSTRAINT fk_project_domain
        FOREIGN KEY (domain_id) REFERENCES DOMAIN(domain_id),
    CONSTRAINT chk_project_dates
        CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_project_capacity CHECK (max_students > 0),
    CONSTRAINT chk_project_status CHECK (status IN ('Open', 'Closed', 'In Progress', 'Completed', 'Cancelled'))
) ENGINE=InnoDB;

CREATE TABLE PROJECT_SKILL (
    project_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level VARCHAR(50) NOT NULL,
    importance VARCHAR(50),
    PRIMARY KEY (project_id, skill_id),
    CONSTRAINT fk_project_skill_project
        FOREIGN KEY (project_id) REFERENCES PROJECT(project_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_skill_skill
        FOREIGN KEY (skill_id) REFERENCES SKILL(skill_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_required_level CHECK (required_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    CONSTRAINT chk_importance CHECK (importance IS NULL OR importance IN ('Low', 'Medium', 'High'))
) ENGINE=InnoDB;

CREATE TABLE APPLICATION (
    student_id INT NOT NULL,
    project_id INT NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    PRIMARY KEY (student_id, project_id),
    CONSTRAINT fk_application_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_application_project
        FOREIGN KEY (project_id) REFERENCES PROJECT(project_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_application_status CHECK (status IN ('Applied', 'Shortlisted', 'Selected', 'Rejected', 'Withdrawn'))
) ENGINE=InnoDB;

CREATE TABLE PROJECT_MEMBER (
    student_id INT NOT NULL,
    project_id INT NOT NULL,
    role VARCHAR(100) NOT NULL,
    joined_date DATE,
    member_status VARCHAR(50) NOT NULL,
    PRIMARY KEY (student_id, project_id),
    CONSTRAINT fk_project_member_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_member_project
        FOREIGN KEY (project_id) REFERENCES PROJECT(project_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_member_status CHECK (member_status IN ('Active', 'Inactive', 'Completed', 'Removed'))
) ENGINE=InnoDB;

CREATE TABLE MATCH_RESULT (
    student_id INT NOT NULL,
    result_no INT NOT NULL,
    project_id INT NOT NULL,
    match_score DECIMAL(5,2),
    matched_skills TEXT,
    missing_skills TEXT,
    status VARCHAR(50) NOT NULL,
    PRIMARY KEY (student_id, result_no),
    CONSTRAINT fk_match_result_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_match_result_project
        FOREIGN KEY (project_id) REFERENCES PROJECT(project_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_match_score CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100),
    CONSTRAINT chk_match_result_no CHECK (result_no > 0),
    CONSTRAINT chk_match_status CHECK (status IN ('Highly Matched', 'Matched', 'Partially Matched', 'Not Matched'))
) ENGINE=InnoDB;

-- ================================================================
-- PART B: SAMPLE DATA
-- ================================================================

INSERT INTO DEPARTMENT (dept_id, dept_name) VALUES
(1, 'Computer Science'),
(2, 'Information Science'),
(3, 'Electronics and Communication');

-- Insert students without supervisors first to satisfy the self-reference.
INSERT INTO STUDENT (student_id, name, year, cgpa, dept_id, supervisor_id) VALUES
(101, 'Rahul', 3, 8.70, 1, NULL),
(102, 'Ananya', 3, 9.10, 1, 101),
(103, 'Vikram', 2, 8.40, 2, 101),
(104, 'Sneha', 4, 9.30, 1, 101),
(105, 'Arjun', 2, 7.90, 3, NULL);

INSERT INTO STUDENT_EMAIL (student_id, email) VALUES
(101, 'rahul@gmail.com'),
(101, 'rahul.college@gmail.com'),
(102, 'ananya@gmail.com'),
(103, 'vikram@gmail.com'),
(104, 'sneha@gmail.com'),
(105, 'arjun@gmail.com');

INSERT INTO SKILL_CATEGORY (category_id, category_name) VALUES
(1, 'Programming'),
(2, 'Database'),
(3, 'Web Development'),
(4, 'Data Science');

INSERT INTO SKILL (skill_id, skill_name, category_id) VALUES
(201, 'Python', 1),
(202, 'Java', 1),
(203, 'SQL', 2),
(204, 'MySQL', 2),
(205, 'HTML', 3),
(206, 'CSS', 3),
(207, 'Machine Learning', 4);

INSERT INTO STUDENT_SKILL
(student_id, skill_id, proficiency_level, years_experience) VALUES
(101, 201, 'Advanced', 2.0),
(101, 203, 'Advanced', 2.5),
(101, 204, 'Intermediate', 1.5),
(102, 201, 'Advanced', 2.0),
(102, 207, 'Advanced', 1.5),
(103, 202, 'Intermediate', 1.0),
(103, 203, 'Advanced', 2.0),
(104, 201, 'Expert', 3.0),
(104, 203, 'Advanced', 3.0),
(104, 207, 'Advanced', 2.0),
(105, 205, 'Advanced', 1.5),
(105, 206, 'Intermediate', 1.0);

INSERT INTO CLIENT (client_id, org_name, contact_name, industry) VALUES
(301, 'TechNova Solutions', 'Kiran Kumar', 'Software'),
(302, 'DataWorks Pvt Ltd', 'Meera Rao', 'Data Analytics'),
(303, 'WebSphere Technologies', 'Rohit Sharma', 'Web Development');

INSERT INTO CLIENT_EMAIL (client_id, email) VALUES
(301, 'contact@technova.com'),
(301, 'hr@technova.com'),
(302, 'contact@dataworks.com'),
(303, 'projects@websphere.com');

INSERT INTO DOMAIN (domain_id, domain_name) VALUES
(401, 'Artificial Intelligence'),
(402, 'Web Development'),
(403, 'Database Systems'),
(404, 'Data Analytics');

INSERT INTO PROJECT
(project_id, title, description, start_date, end_date, max_students, status, client_id, domain_id)
VALUES
(501, 'AI Student Assistant', 'Development of an AI based student assistant.', '2026-01-10', '2026-04-10', 4, 'Open', 301, 401),
(502, 'College Website', 'Development of a responsive college website.', '2026-02-01', '2026-05-01', 5, 'Open', 303, 402),
(503, 'Student Database System', 'Design and implementation of a student database.', '2026-01-15', '2026-04-15', 3, 'Open', 301, 403),
(504, 'Data Analytics Dashboard', 'Development of a dashboard for student analytics.', '2026-03-01', '2026-06-01', 4, 'Open', 302, 404);

INSERT INTO PROJECT_SKILL (project_id, skill_id, required_level, importance) VALUES
(501, 201, 'Advanced', 'High'),
(501, 207, 'Advanced', 'High'),
(501, 203, 'Intermediate', 'Medium'),
(502, 205, 'Advanced', 'High'),
(502, 206, 'Intermediate', 'Medium'),
(503, 203, 'Advanced', 'High'),
(503, 204, 'Advanced', 'High'),
(503, 202, 'Intermediate', 'Medium'),
(504, 201, 'Advanced', 'High'),
(504, 203, 'Intermediate', 'Medium'),
(504, 207, 'Advanced', 'High');

INSERT INTO APPLICATION (student_id, project_id, application_date, status) VALUES
(101, 501, '2026-01-05', 'Applied'),
(101, 503, '2026-01-06', 'Shortlisted'),
(102, 501, '2026-01-07', 'Applied'),
(102, 504, '2026-02-10', 'Applied'),
(103, 503, '2026-01-10', 'Applied'),
(104, 501, '2026-01-08', 'Selected'),
(104, 504, '2026-02-12', 'Shortlisted'),
(105, 502, '2026-01-20', 'Applied'),
(103, 501, '2026-01-11', 'Applied');

INSERT INTO PROJECT_MEMBER (student_id, project_id, role, joined_date, member_status) VALUES
(104, 501, 'AI Developer', '2026-01-10', 'Active'),
(101, 503, 'Database Developer', '2026-01-15', 'Active'),
(105, 502, 'Frontend Developer', '2026-02-01', 'Active');

INSERT INTO MATCH_RESULT
(student_id, result_no, project_id, match_score, matched_skills, missing_skills, status)
VALUES
(101, 1, 501, 78.50, 'Python, SQL', 'Machine Learning', 'Matched'),
(101, 2, 503, 92.00, 'SQL, MySQL', 'Java', 'Highly Matched'),
(102, 1, 501, 95.00, 'Python, Machine Learning', 'SQL', 'Highly Matched'),
(102, 2, 504, 88.00, 'Python, Machine Learning', 'SQL', 'Matched'),
(103, 1, 503, 72.00, 'SQL', 'MySQL, Java', 'Partially Matched'),
(104, 1, 501, 98.00, 'Python, SQL, Machine Learning', '', 'Highly Matched'),
(104, 2, 504, 96.00, 'Python, SQL, Machine Learning', '', 'Highly Matched'),
(105, 1, 502, 91.00, 'HTML, CSS', '', 'Highly Matched');

-- ================================================================
-- PART C: THE FOUR DBMS CONCEPTS
-- ================================================================

-- ================================================================
-- CONCEPT 1: VIEWS
-- ================================================================

-- FIX 6: LEFT JOINs so students with no recorded skills still appear
-- (their skill columns are NULL).
CREATE OR REPLACE VIEW Student_Skill_Profile AS
SELECT s.student_id, s.name AS student_name, s.year, s.cgpa,
       d.dept_name AS department, sk.skill_id, sk.skill_name,
       sc.category_name AS skill_category, ss.proficiency_level,
       ss.years_experience
FROM STUDENT AS s
JOIN DEPARTMENT AS d ON d.dept_id = s.dept_id
LEFT JOIN STUDENT_SKILL AS ss ON ss.student_id = s.student_id
LEFT JOIN SKILL AS sk ON sk.skill_id = ss.skill_id
LEFT JOIN SKILL_CATEGORY AS sc ON sc.category_id = sk.category_id;

CREATE OR REPLACE VIEW Project_Applicants AS
SELECT a.student_id, s.name AS student_name, s.cgpa, a.project_id,
       p.title AS project_title, p.status AS project_status,
       a.application_date, a.status AS application_status
FROM APPLICATION AS a
JOIN STUDENT AS s ON s.student_id = a.student_id
JOIN PROJECT AS p ON p.project_id = a.project_id;

CREATE OR REPLACE VIEW Project_Match_Summary AS
SELECT mr.student_id, s.name AS student_name, mr.result_no,
       mr.project_id, p.title AS project_title, mr.match_score,
       mr.matched_skills, mr.missing_skills, mr.status AS match_status
FROM MATCH_RESULT AS mr
JOIN STUDENT AS s ON s.student_id = mr.student_id
JOIN PROJECT AS p ON p.project_id = mr.project_id;

-- ================================================================
-- CONCEPT 2: STORED PROCEDURES
-- (a) Get_Project_Matches      - ranked matches for a project
-- (b) Assert_Project_Has_Room  - shared rule check used by the triggers
-- (c) Select_Student_For_Project is defined under Concept 4
-- ================================================================

DELIMITER $$

CREATE PROCEDURE Get_Project_Matches(IN p_project_id INT)
BEGIN
    SELECT student_id, student_name, result_no, project_id, project_title,
           match_score, matched_skills, missing_skills, match_status
    FROM Project_Match_Summary
    WHERE project_id = p_project_id
    ORDER BY match_score DESC, student_id ASC, result_no ASC;
END$$

-- FIX 1, 4, 5: one place for the project rules.
--   * locks the project row (FOR UPDATE) so concurrent transactions are
--     serialised per project before members are counted
--   * reports a missing project clearly
--   p_context        : 'Application' or 'Membership' (used in messages)
--   p_check_open     : 1 = project must be Open
--   p_check_capacity : 1 = active members must be below max_students
CREATE PROCEDURE Assert_Project_Has_Room(
    IN p_project_id INT,
    IN p_context VARCHAR(20),
    IN p_check_open TINYINT,
    IN p_check_capacity TINYINT
)
BEGIN
    DECLARE v_status VARCHAR(50) DEFAULT NULL;
    DECLARE v_max_students INT DEFAULT NULL;
    DECLARE v_active_members INT DEFAULT 0;
    DECLARE v_msg VARCHAR(128);

    SELECT status, max_students
      INTO v_status, v_max_students
    FROM PROJECT
    WHERE project_id = p_project_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Rejected: project does not exist';
    END IF;

    IF p_check_open = 1 AND v_status <> 'Open' THEN
        SET v_msg = CONCAT(p_context, ' rejected: project is not open');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF p_check_capacity = 1 THEN
        IF v_max_students IS NULL OR v_max_students <= 0 THEN
            SET v_msg = CONCAT(p_context, ' rejected: project capacity is invalid');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;

        SELECT COUNT(*) INTO v_active_members
        FROM PROJECT_MEMBER
        WHERE project_id = p_project_id
          AND member_status = 'Active';

        IF v_active_members >= v_max_students THEN
            SET v_msg = CONCAT(p_context, ' rejected: project has reached active-member capacity');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- CONCEPT 3: TRIGGERS
-- INSERT triggers : applications and memberships
-- UPDATE triggers : stop capacity being bypassed by later updates (FIX 2)
-- ================================================================

DELIMITER $$

-- Before a new application: project must exist, be Open and have room.
CREATE TRIGGER Check_Application_Eligibility
BEFORE INSERT ON APPLICATION
FOR EACH ROW
BEGIN
    CALL Assert_Project_Has_Room(NEW.project_id, 'Application', 1, 1);
END$$

-- Before a new membership: project must exist and be Open; capacity is
-- only checked when the new member is Active.
CREATE TRIGGER Check_Project_Capacity
BEFORE INSERT ON PROJECT_MEMBER
FOR EACH ROW
BEGIN
    CALL Assert_Project_Has_Room(
        NEW.project_id, 'Membership', 1,
        IF(NEW.member_status = 'Active', 1, 0));
END$$

-- Before a membership update: if a member becomes Active (re-activated
-- or moved to a different project), the target project must have room.
CREATE TRIGGER Check_Member_Update_Capacity
BEFORE UPDATE ON PROJECT_MEMBER
FOR EACH ROW
BEGIN
    IF NEW.member_status = 'Active'
       AND (OLD.member_status <> 'Active' OR OLD.project_id <> NEW.project_id) THEN
        CALL Assert_Project_Has_Room(NEW.project_id, 'Membership', 0, 1);
    END IF;
END$$

-- Before a project update: capacity cannot be lowered below the number
-- of members who are already Active.
CREATE TRIGGER Check_Project_Max_Students_Update
BEFORE UPDATE ON PROJECT
FOR EACH ROW
BEGIN
    DECLARE v_active_members INT DEFAULT 0;

    IF NEW.max_students < OLD.max_students THEN
        SELECT COUNT(*) INTO v_active_members
        FROM PROJECT_MEMBER
        WHERE project_id = OLD.project_id
          AND member_status = 'Active';

        IF NEW.max_students < v_active_members THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Update rejected: max_students is below the current active-member count';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ================================================================
-- CONCEPT 4: TRANSACTIONS (inside a stored procedure)
-- Mark an eligible application Selected and add project membership
-- as one atomic operation. On any SQL error: roll back and rethrow.
-- ================================================================

DELIMITER $$

CREATE PROCEDURE Select_Student_For_Project(
    IN p_student_id INT,
    IN p_project_id INT,
    IN p_role VARCHAR(100)
)
BEGIN
    DECLARE v_updated_rows INT DEFAULT 0;
    DECLARE v_locked_project INT DEFAULT NULL;

    -- Any SQL error (including trigger rejections): undo everything,
    -- then pass the original error to the caller.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_role IS NULL OR TRIM(p_role) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Selection failed: role must not be empty';
    END IF;

    START TRANSACTION;

    -- FIX 1: lock the project row first. Other selections for the same
    -- project wait here, so the capacity count below cannot go stale.
    SELECT project_id INTO v_locked_project
    FROM PROJECT
    WHERE project_id = p_project_id
    FOR UPDATE;

    IF v_locked_project IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Selection failed: project does not exist';
    END IF;

    UPDATE APPLICATION
    SET status = 'Selected'
    WHERE student_id = p_student_id
      AND project_id = p_project_id
      AND status IN ('Applied', 'Shortlisted');

    SET v_updated_rows = ROW_COUNT();

    IF v_updated_rows <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Selection failed: no eligible Applied or Shortlisted application found';
    END IF;

    -- The Check_Project_Capacity trigger fires here; if it rejects the
    -- insert, the handler rolls back the UPDATE above as well.
    INSERT INTO PROJECT_MEMBER
        (student_id, project_id, role, joined_date, member_status)
    VALUES
        (p_student_id, p_project_id, p_role, CURDATE(), 'Active');

    COMMIT;
END$$

DELIMITER ;

-- ================================================================
-- PART D: INDEXES (bonus concept)
-- Speed up the lookups used by the triggers, views and procedures.
-- ================================================================

CREATE INDEX idx_application_project_status ON APPLICATION (project_id, status);
CREATE INDEX idx_member_project_status      ON PROJECT_MEMBER (project_id, member_status);
CREATE INDEX idx_match_project_score        ON MATCH_RESULT (project_id, match_score);

-- ================================================================
-- PART E: VERIFICATION / DEMONSTRATION QUERIES
-- Run these after the script has finished (they are commented out
-- so that running the script itself changes nothing).
-- ================================================================

-- ---- Structure -------------------------------------------------
-- SHOW FULL TABLES;
-- SHOW FULL TABLES WHERE Table_type = 'VIEW';
-- SHOW PROCEDURE STATUS WHERE Db = 'student_skill_project_matching';
-- SHOW TRIGGERS FROM student_skill_project_matching;
-- SHOW INDEX FROM PROJECT_MEMBER;

-- ---- Sample-data counts ---------------------------------------
-- SELECT COUNT(*) AS total_students     FROM STUDENT;      -- expected: 5
-- SELECT COUNT(*) AS total_projects     FROM PROJECT;      -- expected: 4
-- SELECT COUNT(*) AS total_applications FROM APPLICATION;  -- expected: 8
-- SELECT COUNT(*) AS total_matches      FROM MATCH_RESULT; -- expected: 8

-- ---- Views -----------------------------------------------------
-- SELECT * FROM Student_Skill_Profile WHERE student_id = 104;
-- SELECT * FROM Project_Applicants WHERE project_id = 501;
-- SELECT student_name, project_title, match_score, matched_skills, missing_skills
-- FROM Project_Match_Summary ORDER BY match_score DESC;

-- ---- Stored procedure -----------------------------------------
-- CALL Get_Project_Matches(501);

-- ---- Transaction demo (safe: ROLLBACK undoes the change) ------
-- START TRANSACTION;
-- UPDATE APPLICATION SET status = 'Shortlisted'
-- WHERE student_id = 102 AND project_id = 501;
-- SELECT * FROM APPLICATION WHERE student_id = 102 AND project_id = 501;
-- ROLLBACK;
-- SELECT * FROM APPLICATION WHERE student_id = 102 AND project_id = 501;

-- ---- Select a student (changes data: run once on fresh data) --
-- CALL Select_Student_For_Project(102, 501, 'AI Developer');
-- SELECT * FROM APPLICATION    WHERE student_id = 102 AND project_id = 501;
-- SELECT * FROM PROJECT_MEMBER WHERE student_id = 102 AND project_id = 501;

-- ---- Trigger / constraint demos (each one should fail) --------
-- Fix 3 - invalid status value:
--   UPDATE APPLICATION SET status = 'Selcted' WHERE student_id = 101 AND project_id = 501;
-- Fix 5 - project that does not exist:
--   INSERT INTO APPLICATION VALUES (105, 999, CURDATE(), 'Applied');
-- Fix 2 - capacity lowered below active members (project 501 has 1 active):
--   UPDATE PROJECT SET max_students = 0 WHERE project_id = 501;   -- CHECK fails
-- Fix 2 - capacity trigger on UPDATE: fill project 503 (capacity 3), then
--   re-activate an Inactive member and the update is rejected.
-- Rollback proof - second call fails and leaves nothing half-done:
--   CALL Select_Student_For_Project(104, 501, 'Tester');  -- already Selected

-- ---- Queries using GROUP BY / HAVING / aggregates / subqueries --
-- Skills per student:
-- SELECT student_id, student_name, COUNT(skill_id) AS skill_count,
--        AVG(years_experience) AS avg_experience
-- FROM Student_Skill_Profile
-- GROUP BY student_id, student_name
-- ORDER BY skill_count DESC;
--
-- Projects with more than one applicant:
-- SELECT project_id, project_title, COUNT(*) AS applicants
-- FROM Project_Applicants
-- GROUP BY project_id, project_title
-- HAVING COUNT(*) > 1;
--
-- Average and best match score per project:
-- SELECT project_id, project_title, ROUND(AVG(match_score), 2) AS avg_score,
--        MAX(match_score) AS best_score
-- FROM Project_Match_Summary
-- GROUP BY project_id, project_title;
--
-- Matches above the overall average (subquery):
-- SELECT student_name, project_title, match_score
-- FROM Project_Match_Summary
-- WHERE match_score > (SELECT AVG(match_score) FROM MATCH_RESULT)
-- ORDER BY match_score DESC;
--
-- Students who applied but have no match result (subquery):
-- SELECT student_id, name FROM STUDENT
-- WHERE student_id IN (SELECT student_id FROM APPLICATION)
--   AND student_id NOT IN (SELECT student_id FROM MATCH_RESULT);
--
-- Slots left per project:
-- SELECT p.project_id, p.title, p.max_students,
--        COUNT(pm.student_id) AS active_members,
--        p.max_students - COUNT(pm.student_id) AS slots_left
-- FROM PROJECT p
-- LEFT JOIN PROJECT_MEMBER pm
--        ON pm.project_id = p.project_id AND pm.member_status = 'Active'
-- GROUP BY p.project_id, p.title, p.max_students;

-- ---- Known limitation -----------------------------------------
-- Locking serialises changes made through these triggers and the
-- selection procedure. Rules are still application-level conventions
-- (e.g. status values) wherever a CHECK constraint cannot express them.
