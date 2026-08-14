import prisma from '../config/prisma';

export const createPasswordResetToken = async (userId: string, tokenHash: string, expiresAt: Date) => {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
};

export const findPasswordResetTokenByHash = async (tokenHash: string) => {
  return prisma.passwordResetToken.findUnique({
    where: {
      tokenHash,
    },
  });
};

export const deletePasswordResetToken = async (id: string) => {
  return prisma.passwordResetToken.delete({
    where: {
      id,
    },
  });
};

export const deletePasswordResetTokensByUserId = async (userId: string) => {
  return prisma.passwordResetToken.deleteMany({
    where: {
      userId,
    },
  });
};
