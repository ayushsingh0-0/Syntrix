import { ApiError } from '../utils/ApiError';
import {
  createOrgWithFirstMember,
  findOrgById,
  findOrgBySlug,
  findUserOrganizations,
  updateOrg,
  deleteOrg,
  findOrgMember,
  findOrgMembers,
  addOrgMember,
  updateOrgMemberRole,
  removeOrgMember,
  countOrgOwners,
  transferOrgOwnership,
  UpdateOrgData,
} from '../repositories/organization.repository';
import { findUserById } from '../repositories/user.repository';
import { OrganizationRole } from '../generated/prisma/client';
import { SafeOrganization, SafeOrganizationMember } from '../types/organization.types';

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
};

export const generateUniqueSlug = async (baseName: string, requestedSlug?: string): Promise<string> => {
  let base = requestedSlug ? slugify(requestedSlug) : slugify(baseName);
  if (!base || base.length < 2) {
    base = 'org-' + Math.random().toString(36).substring(2, 8);
  }

  let slug = base;
  let counter = 1;

  while (await findOrgBySlug(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

export const createOrganization = async (
  userId: string,
  name: string,
  requestedSlug?: string,
  logoUrl?: string | null
): Promise<SafeOrganization> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (requestedSlug) {
    const existing = await findOrgBySlug(slugify(requestedSlug));
    if (existing) {
      throw new ApiError(409, 'Organization slug is already taken');
    }
  }

  const slug = await generateUniqueSlug(name, requestedSlug);
  const { organization } = await createOrgWithFirstMember({ name, slug, logoUrl }, userId);

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl,
    isArchived: organization.isArchived,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    myRole: OrganizationRole.OWNER,
    memberCount: 1,
  };
};

export const getUserOrgs = async (userId: string): Promise<SafeOrganization[]> => {
  return findUserOrganizations(userId);
};

export const getOrganizationDetails = async (
  orgId: string,
  userId: string
): Promise<SafeOrganization> => {
  const [org, member] = await Promise.all([
    findOrgById(orgId),
    findOrgMember(orgId, userId),
  ]);

  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    isArchived: org.isArchived,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    myRole: member?.role,
    memberCount: org._count.members,
  };
};

export const updateOrganizationDetails = async (
  orgId: string,
  data: UpdateOrgData
): Promise<SafeOrganization> => {
  if (data.slug) {
    const sanitizedSlug = slugify(data.slug);
    const existing = await findOrgBySlug(sanitizedSlug);
    if (existing && existing.id !== orgId) {
      throw new ApiError(409, 'Organization slug is already taken');
    }
    data.slug = sanitizedSlug;
  }

  const updatedOrg = await updateOrg(orgId, data);
  const fullOrg = await findOrgById(updatedOrg.id);

  return {
    id: updatedOrg.id,
    name: updatedOrg.name,
    slug: updatedOrg.slug,
    logoUrl: updatedOrg.logoUrl,
    isArchived: updatedOrg.isArchived,
    createdAt: updatedOrg.createdAt,
    updatedAt: updatedOrg.updatedAt,
    memberCount: fullOrg?._count.members || 1,
  };
};

export const deleteOrganization = async (orgId: string): Promise<void> => {
  const org = await findOrgById(orgId);
  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }
  await deleteOrg(orgId);
};

export const getOrganizationMembers = async (
  orgId: string
): Promise<SafeOrganizationMember[]> => {
  const members = await findOrgMembers(orgId);

  return members.map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    user: m.user,
  }));
};

export const addMemberToOrganization = async (
  orgId: string,
  targetUserId: string,
  role: OrganizationRole = OrganizationRole.MEMBER
): Promise<SafeOrganizationMember> => {
  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'User to add not found');
  }

  const existingMember = await findOrgMember(orgId, targetUserId);
  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this organization');
  }

  const newMember = await addOrgMember(orgId, targetUserId, role);

  return {
    id: newMember.id,
    organizationId: newMember.organizationId,
    userId: newMember.userId,
    role: newMember.role,
    createdAt: newMember.createdAt,
    updatedAt: newMember.updatedAt,
    user: newMember.user,
  };
};

export const updateMemberRoleService = async (
  orgId: string,
  targetUserId: string,
  newRole: OrganizationRole
): Promise<void> => {
  const member = await findOrgMember(orgId, targetUserId);
  if (!member) {
    throw new ApiError(404, 'Member not found in this organization');
  }

  // Prevent demoting the last owner
  if (member.role === OrganizationRole.OWNER && newRole !== OrganizationRole.OWNER) {
    const ownerCount = await countOrgOwners(orgId);
    if (ownerCount <= 1) {
      throw new ApiError(400, 'Cannot demote the sole owner of an organization. Transfer ownership instead.');
    }
  }

  await updateOrgMemberRole(orgId, targetUserId, newRole);
};

export const removeMemberFromOrg = async (
  orgId: string,
  actingUserId: string,
  targetUserId: string
): Promise<void> => {
  const member = await findOrgMember(orgId, targetUserId);
  if (!member) {
    throw new ApiError(404, 'Member not found in this organization');
  }

  // If the target is an OWNER, verify there is at least one other owner
  if (member.role === OrganizationRole.OWNER) {
    const ownerCount = await countOrgOwners(orgId);
    if (ownerCount <= 1) {
      throw new ApiError(400, 'The sole owner cannot leave the organization without transferring ownership or deleting the organization.');
    }
  }

  await removeOrgMember(orgId, targetUserId);
};

export const transferOrganizationOwnership = async (
  orgId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> => {
  if (currentOwnerId === newOwnerId) {
    throw new ApiError(400, 'User is already the owner');
  }

  const targetMember = await findOrgMember(orgId, newOwnerId);
  if (!targetMember) {
    throw new ApiError(404, 'Target user must be a member of the organization before becoming owner');
  }

  await transferOrgOwnership(orgId, currentOwnerId, newOwnerId);
};
