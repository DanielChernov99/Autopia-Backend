import bcrypt from "bcrypt";
import User from "../db/models/User.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

export async function registerUser({ firstName, lastName, email, password }) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await User.create({ firstName, lastName, email, passwordHash });
  } catch (error) {
    // The unique index is what actually guarantees uniqueness; the lookup
    // above only buys a nicer message and cannot close the race.
    if (error.code === 11000) {
      throw new AppError("Email already registered", 409);
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }

  return user;
}
