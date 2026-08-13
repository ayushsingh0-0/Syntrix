import { UserRole } from '../generated/prisma/client';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};
