import { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/client";
import { ApiError } from "../utils/ApiError";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const user = res.locals.user;

    if (!user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
};
