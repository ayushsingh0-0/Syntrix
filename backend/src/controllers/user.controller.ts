import { Request, Response } from "express";
import { getUserById } from "../services/user.service";

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = res.locals.user;

  const user = await getUserById(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const adminTest = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "You are an administrator",
  });
};
