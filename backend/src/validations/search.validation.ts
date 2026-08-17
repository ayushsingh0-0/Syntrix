import { z } from 'zod';

export enum SearchTypeFilter {
  ALL = 'ALL',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  COMMENTS = 'COMMENTS',
  MEMBERS = 'MEMBERS',
}

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'Search query cannot be empty').max(100, 'Search query is too long'),
  type: z.nativeEnum(SearchTypeFilter).optional().default(SearchTypeFilter.ALL),
  projectId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type SearchQueryDTO = z.infer<typeof searchSchema>;
