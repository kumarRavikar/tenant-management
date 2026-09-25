import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      userId: string;
      email: string;
      role: string;
      sessionId: string;
    };
  };
}

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  const allowedOrigins = Array.from(
    new Set([
      'https://tenant-management-gray.vercel.app',
      env.CLIENT_URL,
      'http://localhost:5173',
    ])
  ).filter(Boolean) as string[];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
        role: string;
        sessionId: string;
      };

      socket.data.user = decoded;
      next();
    } catch (err) {
      logger.warn('Socket authentication failed:', err);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (user) {
      // Join personal room for notifications & assignments
      socket.join(`user:${user.userId}`);
      logger.info(`Socket client connected: ${socket.id} (User: ${user.email}, Role: ${user.role})`);

      // Client can join property room
      socket.on('join-property', (propertyId: string) => {
        if (propertyId) {
          socket.join(`property:${propertyId}`);
          logger.debug(`Socket ${socket.id} joined property:${propertyId}`);
        }
      });

      // Client can leave property room
      socket.on('leave-property', (propertyId: string) => {
        if (propertyId) {
          socket.leave(`property:${propertyId}`);
          logger.debug(`Socket ${socket.id} left property:${propertyId}`);
        }
      });

      // Client can join ticket room for real-time discussion
      socket.on('join-ticket', (ticketId: string) => {
        if (ticketId) {
          socket.join(`ticket:${ticketId}`);
          logger.debug(`Socket ${socket.id} joined ticket:${ticketId}`);
        }
      });

      socket.on('leave-ticket', (ticketId: string) => {
        if (ticketId) {
          socket.leave(`ticket:${ticketId}`);
          logger.debug(`Socket ${socket.id} left ticket:${ticketId}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    }
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

// Safe Real-time Event Emitters (do not throw if io is null in unit tests)
export const socketEmitter = {
  emitTicketCreated(propertyId: string, ticket: unknown): void {
    if (!io) return;
    io.to(`property:${propertyId}`).emit('ticket.created', ticket);
  },

  emitTicketAssigned(assigneeUserId: string, ticket: unknown): void {
    if (!io) return;
    io.to(`user:${assigneeUserId}`).emit('ticket.assigned', ticket);
  },

  emitTicketStatusChanged(propertyId: string, ticket: unknown): void {
    if (!io) return;
    io.to(`property:${propertyId}`).emit('ticket.statusChanged', ticket);
  },

  emitTicketCommentAdded(ticketId: string, comment: unknown): void {
    if (!io) return;
    io.to(`ticket:${ticketId}`).emit('ticket.commentAdded', comment);
  },

  emitNotification(userId: string, notification: unknown): void {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification.created', notification);
  },
};
