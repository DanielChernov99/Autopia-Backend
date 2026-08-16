import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET environment variable. Check your .env file.");
  process.exit(1);
}

export function signToken(userId) {
  // "sub" (subject) is the JWT standard claim for who the token is about.
  // The spec requires it to be a string, hence the cast from ObjectId.
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
