import prisma from '../config/prisma';

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (name: string, email: string, password: string) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
};

export const updateUserPassword = async (id: string, password: string) => {
  return prisma.user.update({
    where: { id },
    data: { password },
  });
};

export const markEmailAsVerified = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { isEmailVerified: true },
  });
};

export type UpdateUserProfileData = {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
};

export const updateUserProfile = async (id: string, data: UpdateUserProfileData) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const searchUsers = async (query: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { name: { contains: query } },
      { email: { contains: query } },
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};



