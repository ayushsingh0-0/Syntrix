import { z } from 'zod';
import { OrganizationRole } from '../generated/prisma/client';

export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  role: z
    .enum([OrganizationRole.ADMIN, OrganizationRole.MEMBER, OrganizationRole.GUEST], {
      message: 'Role must be ADMIN, MEMBER, or GUEST',
    })
    .default(OrganizationRole.MEMBER),
});

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
});
