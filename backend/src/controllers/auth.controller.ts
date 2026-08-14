import { Request, Response } from 'express';
import { registerUser, loginUser, refreshUserToken, logoutUser, logoutAllSessions } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const user = await registerUser(name, email, password);

  res.status(201).json({
    success: true,
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await loginUser(email, password);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    data: { accessToken, user },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  
  if (!token) {
    throw new ApiError(401, 'No refresh token provided');
  }

  const { accessToken, refreshToken } = await refreshUserToken(token);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  
  if (token) {
    await logoutUser(token);
  }

  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const logoutAll = async (req: Request, res: Response) => {
  const { userId } = res.locals.user;
  
  await logoutAllSessions(userId);
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out of all sessions successfully',
  });
};

