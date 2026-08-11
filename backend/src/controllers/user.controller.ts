import { Request, Response } from "express";

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = res.locals.userId;

  res.status(200).json({
    success: true,
    data: {
      userId,
    },
  });
};
