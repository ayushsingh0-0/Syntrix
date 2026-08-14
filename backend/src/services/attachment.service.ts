import { AttachmentRepository } from '../repositories/attachment.repository';
import { TaskRepository } from '../repositories/task.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { defaultStorageProvider } from './storage/localStorage.provider';
import { globalActivityService } from './activity.service';
import { ApiError } from '../utils/ApiError';

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

    const attachment = await this.attachmentRepo.createAttachment({
      organizationId: orgId,
      projectId,
      taskId,
      userId,
      filename: storedFile.filename,
      originalName: storedFile.originalName,
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
