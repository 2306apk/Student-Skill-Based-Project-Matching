import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const addSkillSchema = z.object({
  skill_id: z.coerce.number().int().positive('Valid skill ID required'),
  proficiency_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  years_experience: z.coerce.number().min(0, 'Experience must be 0 or greater').max(40),
});

export const updateSkillSchema = z.object({
  proficiency_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  years_experience: z.coerce.number().min(0, 'Experience must be 0 or greater').max(40),
});

export const createProjectSchema = z.object({
  project_id: z.coerce.number().int().positive('Project ID must be a positive integer'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable(),
  max_students: z.coerce.number().int().positive('Maximum students must be greater than 0'),
  status: z.enum(['Open', 'Closed', 'In Progress', 'Completed', 'Cancelled']).default('Open'),
  client_id: z.coerce.number().int().positive('Client ID required'),
  domain_id: z.coerce.number().int().positive('Domain ID required'),
  required_skills: z
    .array(
      z.object({
        skill_id: z.coerce.number().int().positive(),
        required_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
        importance: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
      })
    )
    .optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  max_students: z.coerce.number().int().positive().optional(),
  status: z.enum(['Open', 'Closed', 'In Progress', 'Completed', 'Cancelled']).optional(),
  client_id: z.coerce.number().int().positive().optional(),
  domain_id: z.coerce.number().int().positive().optional(),
});

export const submitApplicationSchema = z.object({
  project_id: z.coerce.number().int().positive('Valid project ID required'),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['Applied', 'Shortlisted', 'Selected', 'Rejected', 'Withdrawn']),
});

export const selectCandidateSchema = z.object({
  student_id: z.coerce.number().int().positive('Student ID required'),
  project_id: z.coerce.number().int().positive('Project ID required'),
  role: z.string().min(2, 'Role must be at least 2 characters').max(100),
});

