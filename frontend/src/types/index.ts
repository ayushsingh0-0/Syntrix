export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

export type OrgPermission =
  | 'ORG_READ'
  | 'ORG_UPDATE'
  | 'ORG_DELETE'
  | 'ORG_TRANSFER'
  | 'MEMBER_INVITE'
  | 'MEMBER_REMOVE'
  | 'MEMBER_ROLE_UPDATE'
  | 'TEAM_MANAGE'
  | 'PROJECT_CREATE'
  | 'PROJECT_READ'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'AUDIT_VIEW';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isArchived: boolean;
  myRole?: OrganizationRole;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  user: User;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token?: string;
  invitationLink?: string;
  expiresAt: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export type TeamRole = 'LEAD' | 'MEMBER';

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  memberCount?: number;
  myRole?: TeamRole | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  user: User;
  joinedAt: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER';

export interface Project {
  id: string;
  organizationId: string;
  teamId?: string | null;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  isArchived: boolean;
  memberCount?: number;
  myRole?: ProjectRole | null;
  team?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: User;
  joinedAt: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}
