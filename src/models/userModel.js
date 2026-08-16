import User from "../db/models/User.js";
import AppError from "../utils/AppError.js";

// The request is authenticated, so a missing user means the token outlived the
// account — the same condition protect.js reports as a 401.
const userNotFound = () => new AppError("Account no longer exists", 401);

export const getUserWithPasswordHash = async (userId) => {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw userNotFound();
  }

  return user;
};

export const updateUserById = async (userId, updateData) => {
  let user;

  try {
    user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("Email already registered", 409);
    }

    throw error;
  }

  if (!user) {
    throw userNotFound();
  }

  return user;
};
