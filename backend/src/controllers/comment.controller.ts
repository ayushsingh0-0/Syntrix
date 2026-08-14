import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CommentService } from '../services/comment.service';
import { createCommentSchema, updateCommentSchema } from '../validations/comment.validation';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  listComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const comments = await this.commentService.getComments(orgId, projectId, taskId);
    res.status(200).json({ success: true, data: comments });
  };

  createComment = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const validated = createCommentSchema.parse(req.body);
    const comment = await this.commentService.createComment(
      orgId,
      projectId,
      taskId,
      userId,
      validated
    );
    res.status(201).json({ success: true, data: comment, message: 'Comment posted successfully' });
  };

  updateComment = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const commentId = getParam(req.params.commentId);
    const validated = updateCommentSchema.parse(req.body);
    const comment = await this.commentService.updateComment(
      orgId,
      projectId,
      taskId,
      commentId,
      userId,
      validated
    );
    res.status(200).json({ success: true, data: comment, message: 'Comment updated successfully' });
  };

  deleteComment = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const commentId = getParam(req.params.commentId);
    await this.commentService.deleteComment(orgId, projectId, taskId, commentId, userId);
    res.status(200).json({ success: true, data: null, message: 'Comment deleted successfully' });
  };

}
