// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";
import { config } from "../lib/config"; // adjust path if needed

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    examNumber?: string;
  };
}

type JwtPayload = DefaultJwtPayload & {
  id?: string;
  role?: string;
  examNumber?: string;
};

const getJwtSecret = () => config?.JWT_SECRET ?? process.env.JWT_SECRET ?? "secret";

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: malformed Authorization header" });
  }

  jwt.verify(token, getJwtSecret(), (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: invalid token" });
    }

    const payload = decoded as JwtPayload;
    if (!payload || !payload.id) {
      return res.status(403).json({ message: "Forbidden: invalid token payload" });
    }

    req.user = {
      id: String(payload.id),
      role: String(payload.role ?? "user"),
      examNumber: payload.examNumber,
    };

    next();
  });
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};
