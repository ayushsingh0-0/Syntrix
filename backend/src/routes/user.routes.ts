import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/me",
  authenticate,
  asyncHandler(getCurrentUser)
);

export default router;
