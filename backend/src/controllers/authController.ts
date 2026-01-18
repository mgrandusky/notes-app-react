import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { generateTokenPair, sanitizeUser, verifyRefreshToken } from '../services/oauthService';
import { sendWelcomeEmail } from '../services/emailService';

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw createError('User with this email or username already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, username).catch(err => console.error('Email error:', err));

    const tokens = generateTokenPair(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens,
      },
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw createError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    const tokens = generateTokenPair(user.id);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens,
      },
    });
  }
);

export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const tokens = generateTokenPair(user.id);
    
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  }
);

export const githubCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const tokens = generateTokenPair(user.id);
    
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw createError('Refresh token is required', 400);
    }

    try {
      const { userId } = verifyRefreshToken(token);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      const tokens = generateTokenPair(userId);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      throw createError('Invalid refresh token', 401);
    }
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;

    res.json({
      success: true,
      data: { user },
    });
  }
);

export const logout = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { username, aiPreferences } = req.body;

    const updateData: { username?: string; aiPreferences?: any } = {};
    if (username) updateData.username = username;
    if (aiPreferences) updateData.aiPreferences = aiPreferences;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  }
);
