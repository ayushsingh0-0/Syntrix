import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';

export type AccessTokenPayload = {
  userId: string;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as any).userId !== 'string'
  ) {
    throw new ApiError(401, 'Invalid access token');
  }

  return {
    userId: (decoded as any).userId,
  };
};
