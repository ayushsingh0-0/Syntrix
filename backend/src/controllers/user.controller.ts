import { Request, Response } from 'express';
import {
  getUserById,
  updateCurrentUserProfile,
  searchPublicUsers,
  getUserActiveSessions,
  revokeUserSession,
} from '../services/user.service';

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = res.locals.user;

  const user = await getUserById(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const { name, bio, avatarUrl, phone } = req.body;

  const updatedUser = await updateCurrentUserProfile(userId, {
    name,
    bio,
    avatarUrl,
    phone,
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
};

export const search = async (req: Request, res: Response): Promise<void> => {
  const { q, page = 1, limit = 10 } = res.locals.query || req.query;

  const results = await searchPublicUsers(q, page, limit);

  res.status(200).json({
    success: true,
    data: results.users,
    meta: {
      total: results.total,
      page: results.page,
      totalPages: results.totalPages,
    },
  });
};


export const getSessions = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const currentToken = req.cookies?.refreshToken;

  const sessions = await getUserActiveSessions(userId, currentToken);

  res.status(200).json({
    success: true,
    data: sessions,
  });
};

export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  const { userId } = res.locals.user;
  const { id: sessionId } = req.params;

  await revokeUserSession(userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Session revoked successfully',
  });
};

export const adminTest = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'You are an administrator',
  });
};

