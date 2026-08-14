import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000),
  parentId: z.string().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(5000),
});
