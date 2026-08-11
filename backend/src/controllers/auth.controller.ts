import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { registerUser, loginUser } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const user = await registerUser(data.name, data.email, data.password);

  res.status(201).json({
    success: true,
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const result = await loginUser(data.email, data.password);
  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

