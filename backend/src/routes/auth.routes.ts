import { Router } from 'express';
import passport from '../config/passport';
import {
  register,
  login,
  googleCallback,
  githubCallback,
  refreshToken,
  getCurrentUser,
  logout,
  updateProfile,
} from '../controllers/authController';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../utils/validators';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Local auth
router.post('/register', authLimiter, validateBody(registerSchema.shape.body), register);
router.post('/login', authLimiter, validateBody(loginSchema.shape.body), login);
router.post('/refresh', refreshToken);
router.post('/logout', requireAuth, logout);

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  githubCallback
);

// User routes
router.get('/me', requireAuth, getCurrentUser);
router.put('/profile', requireAuth, updateProfile);

export default router;
