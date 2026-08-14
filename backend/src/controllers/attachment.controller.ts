import { Request, Response } from 'express';
import fs from 'fs';
import { AttachmentService } from '../services/attachment.service';
import { ApiError } from '../utils/ApiError';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class AttachmentController {
  private attachmentService: AttachmentService;

  constructor() {
    this.attachmentService = new AttachmentService();
  }

  upload = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);

    if (!req.file) {
      throw new ApiError(400, 'No file was uploaded');
    }

    const attachment = await this.attachmentService.uploadTaskAttachment(
      orgId,
      projectId,
      taskId,
      userId,
      req.file
    );

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully',
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);

    const attachments = await this.attachmentService.getTaskAttachments(orgId, projectId, taskId);
    res.status(200).json({ success: true, data: attachments });
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const attachmentId = getParam(req.params.attachmentId);
    const attachment = await this.attachmentService.getAttachmentById(attachmentId);

    if (!fs.existsSync(attachment.path)) {
      throw new ApiError(404, 'File not found on storage server');
    }

    res.download(attachment.path, attachment.originalName);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const orgId = getParam(req.params.id || req.params.orgId);
    const projectId = getParam(req.params.projectId);
    const taskId = getParam(req.params.taskId);
    const attachmentId = getParam(req.params.attachmentId);

    await this.attachmentService.deleteAttachment(orgId, projectId, taskId, attachmentId, userId);
    res.status(200).json({ success: true, data: null, message: 'Attachment deleted successfully' });
  };
}
