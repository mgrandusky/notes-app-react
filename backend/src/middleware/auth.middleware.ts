import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true,
          aiPreferences: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw createError('User not found', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid token', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const requireAuth = authenticate;
