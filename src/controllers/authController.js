import { updateUserById } from "../models/userModel.js";
import {
  changeUserPassword,
  loginUser,
  registerUser,
} from "../services/authService.js";
import { signToken } from "../utils/tokens.js";

function sendAuthResponse(res, user, statusCode, message) {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
  });
}

export async function signup(req, res) {
  const user = await registerUser(req.body);

  sendAuthResponse(res, user, 201, "Account created");
}

export async function login(req, res) {
  const user = await loginUser(req.body);

  sendAuthResponse(res, user, 200, "Logged in");
}

export function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: req.user,
  });
}

export async function updateUserInfo(req, res) {
  const user = await updateUserById(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user,
  });
}

export async function changePassword(req, res) {
  await changeUserPassword(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Password updated",
  });
}
