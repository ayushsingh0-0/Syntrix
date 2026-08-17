import { createAuditLog, CreateAuditLogParams } from '../repositories/auditLog.repository';
import { logSecurityEvent } from '../utils/logger';

export const logAuthEvent = async (params: CreateAuditLogParams): Promise<void> => {
  try {
    await createAuditLog(params);

    logSecurityEvent('AUTH_EVENT', {
      userId: params.userId,
      email: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      action: params.event,
      status: params.event.includes('FAILED') ? 'DENIED' : 'SUCCESS',
      metadata: params.metadata,
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to record auth audit event:', error);
  }
};
