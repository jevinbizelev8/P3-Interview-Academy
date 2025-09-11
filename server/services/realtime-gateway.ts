// Realtime Gateway - Singleton for bridging REST API with WebSocket services
// Allows REST endpoints to emit real-time events to WebSocket clients

import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined;

/**
 * Register the Socket.IO server instance with the gateway
 * Should be called once during WebSocket service initialization
 */
export function registerPrepareIO(_io: SocketIOServer): void {
  io = _io;
  console.log("🌐 RealtimeGateway: Socket.IO server registered");
}

/**
 * Emit an event to a specific session room
 * Used by REST endpoints to notify WebSocket clients in real-time
 */
export function emitToSession(sessionId: string, event: string, payload: any): void {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, payload);
    console.log(`📡 RealtimeGateway: Emitted '${event}' to session:${sessionId}`);
  } else {
    console.warn("⚠️ RealtimeGateway: No Socket.IO server registered, cannot emit event");
  }
}

/**
 * Emit an event to a specific user
 * Used for user-specific notifications
 */
export function emitToUser(userId: string, event: string, payload: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
    console.log(`📡 RealtimeGateway: Emitted '${event}' to user:${userId}`);
  } else {
    console.warn("⚠️ RealtimeGateway: No Socket.IO server registered, cannot emit event");
  }
}