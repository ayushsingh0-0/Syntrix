import prisma from '../config/prisma';

export const createRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: {
      token,
    },
  });
};

export const revokeRefreshToken = async (id: string) => {
  return prisma.refreshToken.update({
    where: {
      id,
    },
    data: {
      isRevoked: true,
    },
  });
};

export const revokeAllUserTokens = async (userId: string) => {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });
};

export const findActiveSessionsByUserId = async (userId: string) => {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const findSessionByIdAndUserId = async (id: string, userId: string) => {
  return prisma.refreshToken.findFirst({
    where: {
      id,
      userId,
      isRevoked: false,
    },
  });
};

