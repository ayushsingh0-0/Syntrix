import { UserRole } from '../generated/prisma/client';

export type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};
