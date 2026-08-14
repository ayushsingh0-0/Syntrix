import prisma from '../config/prisma';
import { AuthAuditEvent } from '../generated/prisma/client';

export type CreateAuditLogParams = {
  event: AuthAuditEvent;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
};

export const createAuditLog = async (params: CreateAuditLogParams) => {
  return prisma.authAuditLog.create({
    data: {
      event: params.event,
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    },
  });
};
