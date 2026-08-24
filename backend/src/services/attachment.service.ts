import path from 'path';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { TaskRepository } from '../repositories/task.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { defaultStorageProvider } from './storage/localStorage.provider';
import { globalActivityService } from './activity.service';
import { ApiError } from '../utils/ApiError';
import { verifyFileMagicBytes, sanitizeFilename } from '../utils/fileSecurity';

export class AttachmentService {
  private attachmentRepo: AttachmentRepository;
  private taskRepo: TaskRepository;

  constructor() {
    this.attachmentRepo = new AttachmentRepository();
    this.taskRepo = new TaskRepository();
  }

  private async validateTaskInProject(orgId: string, projectId: string, taskId: string) {
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId || task.project.organizationId !== orgId) {
      throw new ApiError(404, 'Task not found in this project');
    }
    return task;
  }

  async uploadTaskAttachment(
    orgId: string,
    projectId: string,
    taskId: string,
    userId: string,
    file: Express.Multer.File
  ) {
    if (!file) {
      throw new ApiError(400, 'No file uploaded');
    }

    await this.validateTaskInProject(orgId, projectId, taskId);

    const storedFile = await defaultStorageProvider.saveFile(file);

    // Deep binary signature (magic byte) security verification
    const ext = path.extname(storedFile.originalName);
    const isValidSignature = await verifyFileMagicBytes(storedFile.path, ext);
    if (!isValidSignature) {
      await defaultStorageProvider.deleteFile(storedFile.path);
      throw new ApiError(
        400,
        'File security validation failed: Binary signature does not match the file extension.'
      );
    }

    const sanitizedOriginal = sanitizeFilename(storedFile.originalName);

    const attachment = await this.attachmentRepo.createAttachment({
      organizationId: orgId,
      projectId,
      taskId,
      userId,
      filename: storedFile.filename,
      originalName: sanitizedOriginal,
      mimeType: storedFile.mimeType,
      size: storedFile.size,
      url: storedFile.url,
      path: storedFile.path,
    });

    // Automatic Activity Log
    await globalActivityService.logEvent(orgId, projectId, taskId, userId, 'ATTACHMENT_ADDED', {
      attachmentId: attachment.id,
      originalName: attachment.originalName,
      size: attachment.size,
      mimeType: attachment.mimeType,
    });

    return attachment;
  }

  async getTaskAttachments(orgId: string, projectId: string, taskId: string) {
    await this.validateTaskInProject(orgId, projectId, taskId);
    return this.attachmentRepo.findByTask(taskId);
  }

  async getAttachmentById(attachmentId: string) {
    const attachment = await this.attachmentRepo.findById(attachmentId);
    if (!attachment) {
      throw new ApiError(404, 'Attachment not found');
    }
    return attachment;
  }

  async getAttachmentForDownload(attachmentId: string, userId: string) {
    const attachment = await this.getAttachmentById(attachmentId);

    // Tenant Isolation Check: verify user is a member of the organization owning this attachment
    const member = await findOrgMember(attachment.organizationId, userId);
    if (!member) {
      throw new ApiError(403, 'Access denied: You are not a member of the organization owning this file');
    }

    return attachment;
  }

  async deleteAttachment(
    orgId: string,
    projectId: string,
    taskId: string,
    attachmentId: string,
    userId: string
  ) {
    await this.validateTaskInProject(orgId, projectId, taskId);
    const attachment = await this.attachmentRepo.findById(attachmentId);
    if (!attachment || attachment.taskId !== taskId) {
      throw new ApiError(404, 'Attachment not found on this task');
    }

    // Permission: Uploader or Org Admin/Owner
    const member = await findOrgMember(orgId, userId);
    const isOwnerOrAdmin = member && (member.role === 'OWNER' || member.role === 'ADMIN');
    if (attachment.userId !== userId && !isOwnerOrAdmin) {
      throw new ApiError(403, 'You do not have permission to delete this attachment');
    }

    // Delete physical file from storage
    await defaultStorageProvider.deleteFile(attachment.path);

    // Delete DB record
    await this.attachmentRepo.deleteAttachment(attachmentId);

    // Automatic Activity Log
    await globalActivityService.logEvent(orgId, projectId, taskId, userId, 'ATTACHMENT_DELETED', {
      attachmentId,
      originalName: attachment.originalName,
    });

    return { success: true };
  }
}
