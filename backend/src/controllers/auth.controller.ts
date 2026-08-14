import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  logoutAllSessions,
  changeUserPassword,
  forgotPassword as forgotPasswordService,
  resetUserPassword,
  verifyUserEmail,
  resendVerificationEmail,
} from '../services/auth.service';
import { ApiError } from '../utils/ApiError';

const getAuthContext = (req: Request) => ({
  ipAddress: req.ip || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] as string | undefined,
});

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await registerUser(name, email, password, getAuthContext(req));

  res.status(201).json({
    success: true,
    data: result.user,
    ...(result.debugVerificationToken && { debugVerificationToken: result.debugVerificationToken }),
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await loginUser(email, password, getAuthContext(req));

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

  const { accessToken, refreshToken } = await refreshUserToken(token, getAuthContext(req));

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
    await logoutUser(token, getAuthContext(req));
  }

  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const logoutAll = async (req: Request, res: Response) => {
  const { userId } = res.locals.user;
  
  await logoutAllSessions(userId, getAuthContext(req));
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out of all sessions successfully',
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const { userId } = res.locals.user;
  const { currentPassword, newPassword } = req.body;

  await changeUserPassword(userId, currentPassword, newPassword, getAuthContext(req));
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in with your new password.',
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await forgotPasswordService(email, getAuthContext(req));

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  await resetUserPassword(token, newPassword, getAuthContext(req));
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body;

  await verifyUserEmail(token, getAuthContext(req));

  res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
  });
};

export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await resendVerificationEmail(email);

  res.status(200).json({
    success: true,
    ...result,
  });
};




