import { z } from 'zod';

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  labelId: z.string().optional(),
  columnId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'number', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, 'Label name is required').max(50),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color (e.g. #3b82f6)').default('#3b82f6'),
  description: z.string().trim().max(255).nullable().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color').optional(),
  description: z.string().trim().max(255).nullable().optional(),
});

export const addDependencySchema = z.object({
  dependsOnTaskId: z.string().min(1, 'Target dependent task ID is required'),
  type: z.enum(['BLOCKS', 'BLOCKED_BY', 'RELATES_TO']).default('BLOCKS'),
});

export const updateTaskDetailedSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().nullable().optional(),
  columnId: z.string().nullable().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  assigneeId: z.string().nullable().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  dueDate: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }),
  estimatedHours: z.number().min(0).nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});
