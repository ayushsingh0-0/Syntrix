import { TeamRole } from '../generated/prisma/client';
import { PublicUser } from './user.types';

export type SafeTeam = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  myRole?: TeamRole;
};

export type SafeTeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  createdAt: Date;
  updatedAt: Date;
  user: PublicUser;
};

export type CreateTeamInput = {
  name: string;
  description?: string | null;
};

export type UpdateTeamInput = {
  name?: string;
  description?: string | null;
};
