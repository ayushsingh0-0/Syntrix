import { ApiError } from '../utils/ApiError';
import {
  findUserById,
  updateUserProfile,
  searchUsers,
  UpdateUserProfileData,
} from '../repositories/user.repository';
import {
  findActiveSessionsByUserId,
  findSessionByIdAndUserId,
  revokeRefreshToken,
} from '../repositories/refreshToken.repository';
import { SafeUser, PublicUser } from '../types/user.types';

export const getUserById = async (id: string): Promise<SafeUser> => {
  const user = await findUserById(id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
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
};

export const updateCurrentUserProfile = async (
  userId: string,
  data: UpdateUserProfileData
): Promise<SafeUser> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const updatedUser = await updateUserProfile(userId, data);

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    isEmailVerified: updatedUser.isEmailVerified,
    bio: updatedUser.bio,
    avatarUrl: updatedUser.avatarUrl,
    phone: updatedUser.phone,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

export const searchPublicUsers = async (
  query: string,
  page: number = 1,
  limit: number = 10
) => {
  const result = await searchUsers(query, page, limit);

  const publicUsers: PublicUser[] = result.users.map((u) => ({
    id: u.id,
    name: u.name,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    role: u.role,
  }));

  return {
    users: publicUsers,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  };
};

export const getUserActiveSessions = async (userId: string, currentTokenString?: string) => {
  const sessions = await findActiveSessionsByUserId(userId);

  return sessions.map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    isCurrentSession: currentTokenString ? session.token === currentTokenString : false,
  }));
};

export const revokeUserSession = async (userId: string, sessionId: string) => {
  const session = await findSessionByIdAndUserId(sessionId, userId);

  if (!session) {
    throw new ApiError(404, 'Session not found or already revoked');
  }

  await revokeRefreshToken(session.id);
};


