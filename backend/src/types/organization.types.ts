import { OrganizationRole } from '../generated/prisma/client';
import { OrgPermission } from '../config/permissions';
import { PublicUser } from './user.types';

export type SafeOrganization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  myRole?: OrganizationRole;
  memberCount?: number;
};

export type SafeOrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
  user: PublicUser;
};

export type OrgMemberContext = {
  organizationId: string;
  role: OrganizationRole;
  memberId: string;
  permissions: OrgPermission[];
};

