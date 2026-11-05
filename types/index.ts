export type UserRole = 'STUDENT' | 'ADMIN';

export interface AppUser {
  user_id: number;
  email: string;
  password_hash?: string;
  role: UserRole;
  student_id: number | null;
  created_at: string;
}

export interface SessionUser {
  userId: number;
  email: string;
  role: UserRole;
  studentId: number | null;
  name?: string;
}

export interface Department {
  dept_id: number;
  dept_name: string;
}

export interface Student {
  student_id: number;
  name: string;
  year: number;
  cgpa: number | null;
  dept_id: number;
  dept_name?: string;
  supervisor_id: number | null;
  supervisor_name?: string;
  emails?: string[];
}

export interface SkillCategory {
  category_id: number;
  category_name: string;
}

export interface Skill {
  skill_id: number;
  skill_name: string;
  category_id: number;
  category_name?: string;
}

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface StudentSkill {
  student_id: number;
  skill_id: number;
  skill_name: string;
  category_name: string;
  proficiency_level: ProficiencyLevel;
  years_experience: number;
}

export interface Client {
  client_id: number;
  org_name: string;
  contact_name: string;
  industry: string | null;
}

export interface Domain {
  domain_id: number;
  domain_name: string;
}

export type ProjectStatus = 'Open' | 'Closed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Project {
  project_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number;
  status: ProjectStatus;
  client_id: number;
  client_name?: string;
  domain_id: number;
  domain_name?: string;
  active_members?: number;
  slots_left?: number;
  required_skills?: ProjectSkillRequirement[];
}

export interface ProjectSkillRequirement {
  project_id: number;
  skill_id: number;
  skill_name?: string;
  required_level: ProficiencyLevel;
  importance: 'Low' | 'Medium' | 'High' | null;
}

export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Selected' | 'Rejected' | 'Withdrawn';

export interface Application {
  student_id: number;
  student_name?: string;
  student_cgpa?: number | null;
  student_department?: string;
  project_id: number;
  project_title?: string;
  project_status?: ProjectStatus;
  application_date: string;
  status: ApplicationStatus;
}

export type MemberStatus = 'Active' | 'Inactive' | 'Completed' | 'Removed';

export interface ProjectMember {
  student_id: number;
  student_name?: string;
  project_id: number;
  project_title?: string;
  role: string;
  joined_date: string | null;
  member_status: MemberStatus;
}

export interface MatchResult {
  student_id: number;
  student_name?: string;
  result_no: number;
  project_id: number;
  project_title?: string;
  match_score: number | null;
  matched_skills: string | null;
  missing_skills: string | null;
  match_status: 'Highly Matched' | 'Matched' | 'Partially Matched' | 'Not Matched';
}

export type ActivityEventType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_SHORTLISTED'
  | 'APPLICATION_SELECTED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_WITHDRAWN'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'SKILL_UPDATED'
  | 'SKILL_ADDED'
  | 'SKILL_REMOVED'
  | 'USER_LOGIN';

export interface ActivityLog {
  _id?: string;
  eventType: ActivityEventType;
  studentId?: number | null;
  projectId?: number | null;
  userId?: number | null;
  timestamp: string | Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsOverview {
  totalStudents: number;
  totalProjects: number;
  openProjects: number;
  totalApplications: number;
  activeMembers: number;
  averageMatchScore: number;
  activityCount: number;
}

