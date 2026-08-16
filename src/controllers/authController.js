import { loginUser, registerUser } from "../services/authService.js";
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
