import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/index";

const JWT_SECRET = process.env.SESSION_SECRET || "ef7747c0a8806ff5afe83ebd7bbcdd39";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
    role: "user" | "admin";
  };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  try {
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role as "user" | "admin",
    };

    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication error" });
  }
}

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (decoded) {
    try {
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role as "user" | "admin",
        };
      }
    } catch {
      // Ignore errors, continue without auth
    }
  }

  next();
}
