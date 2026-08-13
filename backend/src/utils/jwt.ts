import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';
import { UserRole } from '../generated/prisma/client';

export type AccessTokenPayload = {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as any).userId !== 'string' ||
    typeof (decoded as any).role !== 'string'
  ) {
    throw new ApiError(401, 'Invalid access token');
  }

  return {
    userId: (decoded as any).userId,
    role: (decoded as any).role,
  };
};
