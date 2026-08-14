import prisma from '../config/prisma';

export const createEmailVerificationToken = async (userId: string, tokenHash: string, expiresAt: Date) => {
  return prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
};

export const findEmailVerificationTokenByHash = async (tokenHash: string) => {
  return prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
  });
};

export const deleteEmailVerificationToken = async (id: string) => {
  return prisma.emailVerificationToken.delete({
    where: {
      id,
    },
  });
};

export const deleteEmailVerificationTokensByUserId = async (userId: string) => {
  return prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
    },
  });
};
