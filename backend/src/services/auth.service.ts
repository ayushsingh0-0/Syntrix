import { findUserByEmail, createUser } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { SafeUser } from '../types/user.types';

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
  
  return { accessToken, user: userData };
};
