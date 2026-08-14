import { z } from 'zod';
import { ProjectPriority, ProjectRole, ProjectStatus } from '../generated/prisma/client';

const projectKeyRegex = /^[A-Z0-9]{2,10}$/;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters'),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key cannot exceed 10 characters')
    .regex(projectKeyRegex, 'Project key must contain only uppercase alphanumeric characters (2-10 chars)'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').nullable().optional(),
  teamId: z.string().trim().nullable().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
  priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),
  startDate: z.coerce.date().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').nullable().optional(),
  teamId: z.string().trim().nullable().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  teamId: z.string().trim().optional(),
  isArchived: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'targetDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export const updateProjectMemberRoleSchema = z.object({
  role: z.nativeEnum(ProjectRole, {
    message: 'Role must be LEAD, MEMBER, or VIEWER',
  }),
});
