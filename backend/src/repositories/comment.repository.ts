import prisma from '../config/prisma';

export class CommentRepository {
  /**
   * Fetch all comments for a task organized as threaded tree
   */
  async findCommentsByTask(taskId: string) {
    return prisma.comment.findMany({
      where: {
        taskId,
        parentId: null, // Get top-level roots
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        mentions: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        replies: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            mentions: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find single comment with author & task info
   */
  async findCommentById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: { select: { id: true, organizationId: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        mentions: true,
      },
    });
  }

  /**
   * Create comment and insert mention records atomically
   */
  async createComment(
    taskId: string,
    userId: string,
    content: string,
    parentId: string | null = null,
    mentionedUserIds: string[] = []
  ) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          taskId,
          userId,
          parentId,
          content,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      if (mentionedUserIds.length > 0) {
        await tx.commentMention.createMany({
          data: mentionedUserIds.map((uId) => ({
            commentId: comment.id,
            userId: uId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.comment.findUnique({
        where: { id: comment.id },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          mentions: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          replies: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
        },
      });
    });
  }

  /**
   * Update comment content and set isEdited to true
   */
  async updateComment(commentId: string, content: string) {
    return prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        mentions: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  /**
   * Delete comment (cascades replies & mentions via Prisma relation onDelete: Cascade)
   */
  async deleteComment(commentId: string) {
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
