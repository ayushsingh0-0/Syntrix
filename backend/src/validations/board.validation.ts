import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().trim().min(2, 'Board name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const createColumnSchema = z.object({
  name: z.string().trim().min(1, 'Column name is required').max(50),
  color: z.string().trim().max(20).nullable().optional(),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().trim().max(20).nullable().optional(),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().min(1),
      position: z.number().int().min(0),
    })
  ).min(1, 'At least one column position must be specified'),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(255),
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
});

export const updateTaskSchema = z.object({
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
});

export const moveTaskSchema = z.object({
  columnId: z.string().min(1, 'Target column ID is required'),
  targetPosition: z.number().min(0, 'Target position must be >= 0'),
  targetStatus: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
});
