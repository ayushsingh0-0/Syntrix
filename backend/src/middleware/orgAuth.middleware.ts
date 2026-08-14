import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { findOrgMember } from '../repositories/organization.repository';
import { OrganizationRole } from '../generated/prisma/client';
import { OrgPermission, getRolePermissions, hasOrgPermission } from '../config/permissions';

export const requireOrgMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = res.locals.user;
  if (!user?.userId) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  const rawOrgId = req.params.orgId || req.params.id;
  const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;

  if (!orgId) {
    next(new ApiError(400, 'Organization ID is required'));
    return;
  }

  const member = await findOrgMember(orgId, user.userId);
  if (!member) {
    next(new ApiError(403, 'You are not a member of this organization'));
    return;
  }

  const permissions = getRolePermissions(member.role);

  res.locals.orgMember = {
    organizationId: member.organizationId,
    role: member.role,
    memberId: member.id,
    permissions,
  };

  next();
};

export const requireOrgRole = (...allowedRoles: OrganizationRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const orgMember = res.locals.orgMember;

    if (!orgMember) {
      next(new ApiError(403, 'Organization membership context missing'));
      return;
    }

    if (!allowedRoles.includes(orgMember.role)) {
      next(
        new ApiError(
          403,
          `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions in this organization`
        )
      );
      return;
    }

    next();
  };
};

export const requireOrgPermission = (...requiredPermissions: OrgPermission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const orgMember = res.locals.orgMember;

    if (!orgMember) {
      next(new ApiError(403, 'Organization membership context missing'));
      return;
    }

    const hasAll = requiredPermissions.every((perm) => hasOrgPermission(orgMember.role, perm));

    if (!hasAll) {
      next(
        new ApiError(
          403,
          `Forbidden: Your role (${orgMember.role}) lacks required permission: [${requiredPermissions.join(', ')}]`
        )
      );
      return;
    }

    next();
  };
};

