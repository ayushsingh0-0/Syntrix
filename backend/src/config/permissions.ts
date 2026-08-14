import { OrganizationRole } from '../generated/prisma/client';

export enum OrgPermission {
  // Organization Management
  ORG_UPDATE = 'ORG_UPDATE',
  ORG_DELETE = 'ORG_DELETE',
  ORG_TRANSFER_OWNERSHIP = 'ORG_TRANSFER_OWNERSHIP',
  BILLING_MANAGE = 'BILLING_MANAGE',

  // Member Management
  MEMBER_READ = 'MEMBER_READ',
  MEMBER_INVITE = 'MEMBER_INVITE',
  MEMBER_REMOVE = 'MEMBER_REMOVE',
  MEMBER_ROLE_UPDATE = 'MEMBER_ROLE_UPDATE',

  // Team Management
  TEAM_MANAGE = 'TEAM_MANAGE',

  // Project Management
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_READ = 'PROJECT_READ',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
}

export const ROLE_HIERARCHY_RANK: Record<OrganizationRole, number> = {
  [OrganizationRole.OWNER]: 50,
  [OrganizationRole.ADMIN]: 40,
  [OrganizationRole.MANAGER]: 30,
  [OrganizationRole.MEMBER]: 20,
  [OrganizationRole.GUEST]: 10,
};

export const ROLE_PERMISSIONS: Record<OrganizationRole, OrgPermission[]> = {
  [OrganizationRole.OWNER]: [
    OrgPermission.ORG_UPDATE,
    OrgPermission.ORG_DELETE,
    OrgPermission.ORG_TRANSFER_OWNERSHIP,
    OrgPermission.BILLING_MANAGE,
    OrgPermission.MEMBER_READ,
    OrgPermission.MEMBER_INVITE,
    OrgPermission.MEMBER_REMOVE,
    OrgPermission.MEMBER_ROLE_UPDATE,
    OrgPermission.TEAM_MANAGE,
    OrgPermission.PROJECT_CREATE,
    OrgPermission.PROJECT_READ,
    OrgPermission.PROJECT_UPDATE,
    OrgPermission.PROJECT_DELETE,
  ],
  [OrganizationRole.ADMIN]: [
    OrgPermission.ORG_UPDATE,
    OrgPermission.MEMBER_READ,
    OrgPermission.MEMBER_INVITE,
    OrgPermission.MEMBER_REMOVE,
    OrgPermission.MEMBER_ROLE_UPDATE,
    OrgPermission.TEAM_MANAGE,
    OrgPermission.PROJECT_CREATE,
    OrgPermission.PROJECT_READ,
    OrgPermission.PROJECT_UPDATE,
    OrgPermission.PROJECT_DELETE,
  ],
  [OrganizationRole.MANAGER]: [
    OrgPermission.MEMBER_READ,
    OrgPermission.MEMBER_INVITE,
    OrgPermission.TEAM_MANAGE,
    OrgPermission.PROJECT_CREATE,
    OrgPermission.PROJECT_READ,
    OrgPermission.PROJECT_UPDATE,
    OrgPermission.PROJECT_DELETE,
  ],
  [OrganizationRole.MEMBER]: [
    OrgPermission.MEMBER_READ,
    OrgPermission.PROJECT_READ,
    OrgPermission.PROJECT_CREATE,
  ],
  [OrganizationRole.GUEST]: [
    OrgPermission.PROJECT_READ,
  ],
};

export const hasOrgPermission = (role: OrganizationRole, permission: OrgPermission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const getRolePermissions = (role: OrganizationRole): OrgPermission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const canManageTargetRole = (actorRole: OrganizationRole, targetRole: OrganizationRole): boolean => {
  return ROLE_HIERARCHY_RANK[actorRole] > ROLE_HIERARCHY_RANK[targetRole];
};

export const canAssignRole = (actorRole: OrganizationRole, newRole: OrganizationRole): boolean => {
  return ROLE_HIERARCHY_RANK[actorRole] > ROLE_HIERARCHY_RANK[newRole];
};
