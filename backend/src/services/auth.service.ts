import { findUserByEmail, findUserById, createUser, updateUserPassword, markEmailAsVerified } from '../repositories/user.repository';
import { createRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../repositories/refreshToken.repository';
import { createPasswordResetToken, findPasswordResetTokenByHash, deletePasswordResetTokensByUserId } from '../repositories/passwordReset.repository';
import {
  createEmailVerificationToken,
  findEmailVerificationTokenByHash,
  deleteEmailVerificationTokensByUserId,
} from '../repositories/emailVerification.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { generateOpaqueToken, hashToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';
import { SafeUser } from '../types/user.types';
import { logAuthEvent } from './audit.service';
import { AuthAuditEvent } from '../generated/prisma/client';
import prisma from '../config/prisma';

export type AuthContext = {
  ipAddress?: string;
  userAgent?: string;
};

export const registerUser = async (name: string, email: string, password: string, context?: AuthContext) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }
  const hashedPassword = await hashPassword(password);
  const user = await createUser(name, email, hashedPassword);

  // Generate initial email verification token (24 hours)
  const rawVerificationToken = generateOpaqueToken();
  const tokenHash = hashToken(rawVerificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createEmailVerificationToken(user.id, tokenHash, expiresAt);

  console.log(`[AUTH] Email verification token generated for ${user.email}: ${rawVerificationToken}`);

  await logAuthEvent({
    event: AuthAuditEvent.REGISTER_SUCCESS,
    userId: user.id,
    email: user.email,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });

  const safeUser: SafeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };


  return {
    user: safeUser,
    ...(process.env.NODE_ENV !== 'production' && { debugVerificationToken: rawVerificationToken }),
  };
};

export const loginUser = async (email: string, password: string, context?: AuthContext) => {
  const user = await findUserByEmail(email);
  if (!user) {
    await logAuthEvent({
      event: AuthAuditEvent.LOGIN_FAILED,
      email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { reason: 'User not found' },
    });
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    await logAuthEvent({
      event: AuthAuditEvent.LOGIN_FAILED,
      userId: user.id,
      email: user.email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { reason: 'Invalid password' },
    });
    throw new ApiError(401, 'Invalid email or password');
  }

  const { password: _, ...userData } = user;
  const accessToken = generateAccessToken(user.id, user.role);
  
  const tokenString = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshToken = await createRefreshToken(user.id, tokenString, expiresAt);

  await logAuthEvent({
    event: AuthAuditEvent.LOGIN_SUCCESS,
    userId: user.id,
    email: user.email,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });

  return { accessToken, refreshToken: refreshToken.token, user: userData };
};

export const refreshUserToken = async (tokenString: string, context?: AuthContext) => {
  const tokenRecord = await findRefreshToken(tokenString);

  if (!tokenRecord) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Reuse detection: If token is already revoked, it's compromised. Nuke all sessions.
  if (tokenRecord.isRevoked) {
    await logAuthEvent({
      event: AuthAuditEvent.TOKEN_REUSE_DETECTED,
      userId: tokenRecord.userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { tokenId: tokenRecord.id },
    });

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

export const logoutUser = async (tokenString: string, context?: AuthContext) => {
  const tokenRecord = await findRefreshToken(tokenString);
  if (tokenRecord) {
    await logAuthEvent({
      event: AuthAuditEvent.LOGOUT,
      userId: tokenRecord.userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    await revokeRefreshToken(tokenRecord.id);
  }
};

export const logoutAllSessions = async (userId: string, context?: AuthContext) => {
  await logAuthEvent({
    event: AuthAuditEvent.LOGOUT_ALL,
    userId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
  await revokeAllUserTokens(userId);
};

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  context?: AuthContext
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

  await logAuthEvent({
    event: AuthAuditEvent.PASSWORD_CHANGED,
    userId: user.id,
    email: user.email,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
};

export const forgotPassword = async (email: string, context?: AuthContext) => {
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

  await logAuthEvent({
    event: AuthAuditEvent.PASSWORD_RESET_REQUESTED,
    userId: user.id,
    email: user.email,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });

  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Included in response for development convenience
    ...(process.env.NODE_ENV !== 'production' && { debugToken: rawToken }),
  };
};

export const resetUserPassword = async (rawToken: string, newPassword: string, context?: AuthContext) => {
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

  await logAuthEvent({
    event: AuthAuditEvent.PASSWORD_RESET_COMPLETED,
    userId: resetRecord.userId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
};

export const verifyUserEmail = async (rawToken: string, context?: AuthContext) => {
  const tokenHash = hashToken(rawToken);
  const tokenRecord = await findEmailVerificationTokenByHash(tokenHash);

  if (!tokenRecord) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    await deleteEmailVerificationTokensByUserId(tokenRecord.userId);
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  await markEmailAsVerified(tokenRecord.userId);
  await deleteEmailVerificationTokensByUserId(tokenRecord.userId);

  await logAuthEvent({
    event: AuthAuditEvent.EMAIL_VERIFIED,
    userId: tokenRecord.userId,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
  });
};

export const resendVerificationEmail = async (email: string) => {
  const user = await findUserByEmail(email);

  // Anti-enumeration: Return success message if user doesn't exist or is already verified
  if (!user || user.isEmailVerified) {
    return {
      message: 'If an unverified account with that email exists, a verification link has been sent.',
    };
  }

  // Clear previous verification tokens
  await deleteEmailVerificationTokensByUserId(user.id);

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await createEmailVerificationToken(user.id, tokenHash, expiresAt);

  console.log(`[AUTH] Resent verification token for ${user.email}: ${rawToken}`);

  return {
    message: 'If an unverified account with that email exists, a verification link has been sent.',
    ...(process.env.NODE_ENV !== 'production' && { debugVerificationToken: rawToken }),
  };
};



