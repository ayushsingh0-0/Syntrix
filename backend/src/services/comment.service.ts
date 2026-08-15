import { CommentRepository } from '../repositories/comment.repository';
import { TaskRepository } from '../repositories/task.repository';
import { findOrgMember } from '../repositories/organization.repository';
import { globalActivityService } from './activity.service';
import { globalNotificationService } from './notification.service';
import { ApiError } from '../utils/ApiError';

import prisma from '../config/prisma';
import type { CreateCommentDTO, UpdateCommentDTO } from '../types/comment.types';

export class CommentService {
  private commentRepo: CommentRepository;
  private taskRepo: TaskRepository;

  constructor() {
    this.commentRepo = new CommentRepository();
    this.taskRepo = new TaskRepository();
  }

  /**
   * Helper: Parse content string and resolve mentioned organization user IDs
   */
  private async extractMentionedUserIds(orgId: string, content: string): Promise<string[]> {
    // Match @mentions like @alex, @alex@syntrix.com, or @userId
    const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/g;
    const matches = Array.from(content.matchAll(mentionRegex), (m) => m[1]);

    if (!matches || matches.length === 0) return [];

    // Find org members whose name, email, or id matches the tokens
    const orgMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        user: {
          OR: [
            { email: { in: matches } },
            { name: { in: matches } },
            { id: { in: matches } },
          ],
        },
      },
      select: { userId: true },
    });

    return Array.from(new Set(orgMembers.map((m) => m.userId)));
  }

  /**
   * Helper: Validate task exists in project & org
   */
  private async validateTaskInProject(orgId: string, projectId: string, taskId: string) {
    const task = await this.taskRepo.findTaskDetailsById(taskId);
    if (!task || task.projectId !== projectId || task.project.organizationId !== orgId) {
      throw new ApiError(404, 'Task not found in this project');
    }
    return task;
  }


  /**
   * List threaded comments for a task
   */
  async getComments(orgId: string, projectId: string, taskId: string) {
    await this.validateTaskInProject(orgId, projectId, taskId);
    return this.commentRepo.findCommentsByTask(taskId);
  }

  /**
   * Create a new comment or reply
   */
  async createComment(
    orgId: string,
    projectId: string,
    taskId: string,
    userId: string,
    data: CreateCommentDTO
  ) {
    await this.validateTaskInProject(orgId, projectId, taskId);

    if (data.parentId) {
      const parentComment = await this.commentRepo.findCommentById(data.parentId);
      if (!parentComment || parentComment.taskId !== taskId) {
        throw new ApiError(404, 'Parent comment not found on this task');
      }
    }

    const mentionedUserIds = await this.extractMentionedUserIds(orgId, data.content);

    const comment = await this.commentRepo.createComment(
      taskId,
      userId,
      data.content,
      data.parentId || null,
      mentionedUserIds
    );

    // Automatic Activity Log
    await globalActivityService.logEvent(orgId, projectId, taskId, userId, 'COMMENT_ADDED', {
      commentId: comment?.id,
      isReply: !!data.parentId,
      mentionedCount: mentionedUserIds.length,
    });

    // Automatic Notifications for @mentions
    if (mentionedUserIds.length > 0 && comment) {
      const task = await this.taskRepo.findTaskDetailsById(taskId);
      await globalNotificationService.notifyMentionInComment(
        mentionedUserIds,
        userId,
        comment.user.name,
        orgId,
        projectId,
        taskId,
        task?.key || 'Task',
        data.content
      );
    }

    return comment;

  }

  /**
   * Update comment content
   */
  async updateComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    data: UpdateCommentDTO
  ) {
    await this.validateTaskInProject(orgId, projectId, taskId);
    const comment = await this.commentRepo.findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) {
      throw new ApiError(404, 'Comment not found on this task');
    }

    // Permission check: Author or Org Admin
    const member = await findOrgMember(orgId, userId);
    const isOwnerOrAdmin = member && (member.role === 'OWNER' || member.role === 'ADMIN');
    if (comment.userId !== userId && !isOwnerOrAdmin) {
      throw new ApiError(403, 'You do not have permission to edit this comment');
    }

    return this.commentRepo.updateComment(commentId, data.content);
  }

  /**
   * Delete comment
   */
  async deleteComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string
  ) {
    await this.validateTaskInProject(orgId, projectId, taskId);
    const comment = await this.commentRepo.findCommentById(commentId);
    if (!comment || comment.taskId !== taskId) {
      throw new ApiError(404, 'Comment not found on this task');
    }

    // Permission check: Author or Org Admin
    const member = await findOrgMember(orgId, userId);
    const isOwnerOrAdmin = member && (member.role === 'OWNER' || member.role === 'ADMIN');
    if (comment.userId !== userId && !isOwnerOrAdmin) {
      throw new ApiError(403, 'You do not have permission to delete this comment');
    }

    await this.commentRepo.deleteComment(commentId);

    // Automatic Activity Log
    await globalActivityService.logEvent(orgId, projectId, taskId, userId, 'COMMENT_DELETED', {
      commentId,
    });

    return { success: true };
  }
}
