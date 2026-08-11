import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new ApiError(401, "Invalid authorization header"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    res.locals.userId = payload.userId;

    next();
  } catch (error) {
    next(error);
  }
};
