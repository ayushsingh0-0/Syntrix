import prisma from '../config/prisma';
import type { CreateAttachmentDTO } from '../types/attachment.types';

export class AttachmentRepository {
  /**
   * Create attachment metadata entry
   */
  async createAttachment(data: CreateAttachmentDTO) {
    return prisma.attachment.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        userId: data.userId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        path: data.path,
      },
      include: {
        uploader: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  /**
   * Find attachments by task ID
   */
  async findByTask(taskId: string) {
    return prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  /**
   * Find single attachment by ID
   */
  async findById(attachmentId: string) {
    return prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: {
            project: { select: { id: true, organizationId: true } },
          },
        },
        uploader: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  /**
   * Delete attachment database entry
   */
  async deleteAttachment(attachmentId: string) {
    return prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }
}
