import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from './config/passport';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth.routes';
import noteRoutes from './routes/note.routes';
import shareRoutes from './routes/share.routes';
import aiRoutes from './routes/ai.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/ai', aiRoutes);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
