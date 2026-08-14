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
