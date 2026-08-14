import crypto from 'crypto';

export const generateOpaqueToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};
