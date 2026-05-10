import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // Debug: Log incoming cookies and headers
  console.log(`[Auth Debug] Path: ${req.path}, Cookies:`, Object.keys(req.cookies));

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
    console.log("[Auth Debug] Found accessToken in cookies");
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("[Auth Debug] Found token in Authorization header");
  }

  if (!token) {
    console.warn("[Auth Debug] No token found - returning 401");
    res.status(401).json({ success: false, message: "Not authorized to access this route" });
    return;
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await prisma.blacklistedToken.findUnique({
      where: { token },
    });

    if (isBlacklisted) {
      console.warn("[Auth Debug] Token is blacklisted");
      res.status(401).json({ success: false, message: "Token has been revoked" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as JwtPayload;
    console.log("[Auth Debug] Token verified for user ID:", decoded.id);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      console.warn("[Auth Debug] User not found in DB for ID:", decoded.id);
      res.status(401).json({ success: false, message: "User belonging to this token no longer exists" });
      return;
    }

    console.log("[Auth Debug] Auth successful for user:", user.email, "Role:", user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error("[Auth Debug] JWT Verification Error:", error);
    res.status(401).json({ success: false, message: "Not authorized to access this route" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
      return;
    }
    next();
  };
};
