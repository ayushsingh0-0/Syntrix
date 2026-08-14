import { z } from 'zod';

export const createSprintSchema = z.object({
  name: z.string().trim().min(1, 'Sprint name is required').max(100),
  goal: z.string().trim().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  goal: z.string().trim().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const startSprintSchema = z.object({
  startDate: z.string().datetime({ message: 'Valid ISO startDate is required' }),
  endDate: z.string().datetime({ message: 'Valid ISO endDate is required' }),
  goal: z.string().trim().nullable().optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'Sprint end date must be strictly after start date',
  path: ['endDate'],
});

export const completeSprintSchema = z.object({
  rolloverToSprintId: z.string().nullable().optional(),
});

export const assignTasksToSprintSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'Provide at least one taskId to assign'),
});
