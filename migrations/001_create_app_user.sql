-- ================================================================
-- ADDITIVE MIGRATION: 001_create_app_user.sql
-- Adds authentication table for Student Skill-Project Matching System
-- Does NOT touch or drop existing database schema or sample data.
-- ================================================================

CREATE TABLE IF NOT EXISTS APP_USER (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    student_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_user_student
        FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_app_user_role
        CHECK (role IN ('STUDENT', 'ADMIN')),
    INDEX idx_app_user_email (email),
    INDEX idx_app_user_student (student_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
