import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeWebSocket } from './services/websocketService';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT);

const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
      logger.info(`🤖 OpenAI configured: ${env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(async () => {
    await disconnectDatabase();
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

startServer();
