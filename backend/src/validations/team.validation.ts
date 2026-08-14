import { z } from 'zod';
import { TeamRole } from '../generated/prisma/client';

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters')
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
});

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z
    .enum([TeamRole.LEAD, TeamRole.MEMBER], {
      message: 'Role must be LEAD or MEMBER',
    })
    .default(TeamRole.MEMBER),
});

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum([TeamRole.LEAD, TeamRole.MEMBER], {
    message: 'Role must be LEAD or MEMBER',
  }),
});
