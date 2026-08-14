import { findUserByEmail, createUser } from '../repositories/user.repository';
import { createRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../repositories/refreshToken.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { generateOpaqueToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';
import { SafeUser } from '../types/user.types';
import prisma from '../config/prisma';

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }
  const hashedPassword = await hashPassword(password);
  const user = await createUser(name, email, hashedPassword);
  const safeUser: SafeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return safeUser;
};

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { password: _, ...userData } = user;
  const accessToken = generateAccessToken(user.id, user.role);
  
  const tokenString = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshToken = await createRefreshToken(user.id, tokenString, expiresAt);

  return { accessToken, refreshToken: refreshToken.token, user: userData };
};

export const refreshUserToken = async (tokenString: string) => {
  const tokenRecord = await findRefreshToken(tokenString);

  if (!tokenRecord) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Reuse detection: If token is already revoked, it's compromised. Nuke all sessions.
  if (tokenRecord.isRevoked) {
    await revokeAllUserTokens(tokenRecord.userId);
    throw new ApiError(401, 'Token reused - all sessions revoked for security');
  }

  // Check expiry
  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    throw new ApiError(401, 'Refresh token expired');
  }

  // Find user (to get latest role)
  const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  // Rotation: Revoke old token
  await revokeRefreshToken(tokenRecord.id);

  // Issue new tokens
  const newAccessToken = generateAccessToken(user.id, user.role);
  const newTokenString = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const newRefreshToken = await createRefreshToken(user.id, newTokenString, expiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken.token };
};

export const logoutUser = async (tokenString: string) => {
  const tokenRecord = await findRefreshToken(tokenString);
  if (tokenRecord) {
    await revokeRefreshToken(tokenRecord.id);
  }
};

export const logoutAllSessions = async (userId: string) => {
  await revokeAllUserTokens(userId);
};
