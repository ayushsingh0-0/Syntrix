import { findUserByEmail, findUserById, createUser, updateUserPassword } from '../repositories/user.repository';
import { createRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../repositories/refreshToken.repository';
import { createPasswordResetToken, findPasswordResetTokenByHash, deletePasswordResetTokensByUserId } from '../repositories/passwordReset.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { generateOpaqueToken, hashToken } from '../utils/token';
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

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUserPassword(userId, hashedPassword);

  // Security: Invalidate all existing sessions after password change
  await revokeAllUserTokens(userId);
};

export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);

  // Prevent email enumeration: always return success message regardless of existence
  if (!user) {
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  // Clear any existing reset tokens for this user
  await deletePasswordResetTokensByUserId(user.id);

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  console.log(`[AUTH] Password reset token generated for ${user.email}: ${rawToken}`);

  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Included in response for development convenience
    ...(process.env.NODE_ENV !== 'production' && { debugToken: rawToken }),
  };
};

export const resetUserPassword = async (rawToken: string, newPassword: string) => {
  const tokenHash = hashToken(rawToken);
  const resetRecord = await findPasswordResetTokenByHash(tokenHash);

  if (!resetRecord) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  if (resetRecord.expiresAt.getTime() < Date.now()) {
    await deletePasswordResetTokensByUserId(resetRecord.userId);
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUserPassword(resetRecord.userId, hashedPassword);

  // Clean up reset tokens
  await deletePasswordResetTokensByUserId(resetRecord.userId);

  // Security: Revoke all active sessions
  await revokeAllUserTokens(resetRecord.userId);
};

