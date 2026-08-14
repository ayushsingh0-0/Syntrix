import { z } from 'zod';
import { OrganizationRole } from '../generated/prisma/client';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(50, 'Organization name cannot exceed 50 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(slugRegex, 'Slug must only contain lowercase alphanumeric characters and single hyphens')
    .optional(),
  logoUrl: z.string().url('Invalid logo URL').nullable().optional().or(z.literal('')),
});

export const updateOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(50, 'Organization name cannot exceed 50 characters').optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(slugRegex, 'Slug must only contain lowercase alphanumeric characters and single hyphens')
    .optional(),
  logoUrl: z.string().url('Invalid logo URL').nullable().optional().or(z.literal('')),
  isArchived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum([OrganizationRole.ADMIN, OrganizationRole.MEMBER, OrganizationRole.GUEST]).default(OrganizationRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([OrganizationRole.ADMIN, OrganizationRole.MEMBER, OrganizationRole.GUEST], {
    message: 'Role must be ADMIN, MEMBER, or GUEST (use transfer-ownership to change OWNER)',
  }),
});


export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner user ID is required'),
});
