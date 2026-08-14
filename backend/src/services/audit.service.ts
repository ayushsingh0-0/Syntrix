import { createAuditLog, CreateAuditLogParams } from '../repositories/auditLog.repository';

export const logAuthEvent = async (params: CreateAuditLogParams): Promise<void> => {
  try {
    await createAuditLog(params);
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to record auth audit event:', error);
  }
};
