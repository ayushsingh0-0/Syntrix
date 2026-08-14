import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').nullable().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').nullable().optional().or(z.literal('')),
  phone: z.string().max(30, 'Phone cannot exceed 30 characters').nullable().optional(),
});

export const searchUserSchema = z.object({
  q: z.string().trim().min(1, 'Search query is required'),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(50).default(10).optional(),
});
