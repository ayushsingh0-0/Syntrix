import { UserRole } from '../generated/prisma/client';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
};


