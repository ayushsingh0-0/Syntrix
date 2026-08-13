import { Router } from "express";
import { getCurrentUser, adminTest } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRole } from "../generated/prisma/client";

const router = Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(getCurrentUser)
);

router.get(
  "/admin-test",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminTest)
);

export default router;
