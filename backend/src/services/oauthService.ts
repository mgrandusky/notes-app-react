import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
};

export const generateTokenPair = (userId: string) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user;
  return sanitized;
};
