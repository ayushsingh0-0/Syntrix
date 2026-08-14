import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from './../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../validations/auth.validation';

const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post('/refresh', asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
authRouter.post('/logout-all', authenticate, asyncHandler(logoutAll));
authRouter.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(changePassword));
authRouter.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword));
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(resetPassword));
authRouter.post('/verify-email', validate(verifyEmailSchema), asyncHandler(verifyEmail));
authRouter.post('/resend-verification', authLimiter, validate(resendVerificationSchema), asyncHandler(resendVerification));

export default authRouter;



