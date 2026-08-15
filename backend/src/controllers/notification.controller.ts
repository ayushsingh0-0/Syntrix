import { Request, Response } from 'express';
import { globalNotificationService } from '../services/notification.service';

const getParam = (param: string | string[] | undefined): string => {
  return Array.isArray(param) ? param[0] : (param || '');
};

export class NotificationController {
  list = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await globalNotificationService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly,
    });

    res.status(200).json({ success: true, data: result });
  };

  unreadCount = async (_req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const result = await globalNotificationService.getUnreadCount(userId);
    res.status(200).json({ success: true, data: result });
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const id = getParam(req.params.id);

    const result = await globalNotificationService.markAsRead(id, userId);
    res.status(200).json({ success: true, data: result, message: 'Notification marked as read' });
  };

  markAllRead = async (_req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const result = await globalNotificationService.markAllAsRead(userId);
    res.status(200).json({ success: true, data: result, message: 'All notifications marked as read' });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = res.locals.user?.userId;
    const id = getParam(req.params.id);

    const result = await globalNotificationService.deleteNotification(id, userId);
    res.status(200).json({ success: true, data: result, message: 'Notification deleted' });
  };
}
