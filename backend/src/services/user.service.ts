import { ApiError } from "../utils/ApiError";
import { findUserById } from "../repositories/user.repository";

export const getUserById = async (id: string) => {
  const user = await findUserById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

