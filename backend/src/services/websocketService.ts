import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let io: Server | null = null;

export const initializeWebSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on('join-room', (userId: string) => {
      socket.join(`user-${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

export const notifyNoteCreated = (userId: string, note: any) => {
  emitToUser(userId, 'note:created', note);
};

export const notifyNoteUpdated = (userId: string, note: any) => {
  emitToUser(userId, 'note:updated', note);
};

export const notifyNoteDeleted = (userId: string, noteId: string) => {
  emitToUser(userId, 'note:deleted', { noteId });
};

export const notifyNoteShared = (userId: string, shareData: any) => {
  emitToUser(userId, 'note:shared', shareData);
};
