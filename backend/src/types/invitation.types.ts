import { InvitationStatus, OrganizationRole } from '../generated/prisma/client';
import { PublicUser } from './user.types';

export type SafeInvitation = {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  invitedById: string;
  expiresAt: Date;
  status: InvitationStatus;
  createdAt: Date;
  invitedBy?: PublicUser;
};

export type InvitationPreview = {
  id: string;
  email: string;
  role: OrganizationRole;
  expiresAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  invitedBy: {
    name: string;
    avatarUrl: string | null;
  };
};
