import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { RoleService } from '../services/role.service.js';
import { setRealtimeServer } from './accessEvents.js';

const localDevOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):30\d{2}$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return env.corsOrigins.includes(origin) || (env.nodeEnv === 'development' && localDevOriginPattern.test(origin));
}

function tokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers?.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}

export function initRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = tokenFromHandshake(socket);
      if (!token) throw new Error('Authentication required');

      const decoded = jwt.verify(token, env.jwtSecret);
      
      const profile = await UserProfileModel.findById(decoded.userId);
      if (!profile || profile.status !== 'active') throw new Error('Account is not active');

      socket.user = {
        id: profile.id,
        role: profile.role,
        capabilities: await RoleService.resolveUserCapabilities(profile),
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
  });

  setRealtimeServer(io);
  return io;
}
