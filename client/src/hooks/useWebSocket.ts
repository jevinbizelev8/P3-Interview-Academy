import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  query?: Record<string, string>;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionAttempts: number;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  sendMessage: (message: WebSocketMessage) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url = process.env.NODE_ENV === 'production' 
      ? 'wss://your-production-domain.com' 
      : 'ws://localhost:3000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    query = {}
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const socket = io(url, {
        query,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setConnectionAttempts(0);
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Auto-reconnect logic
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }

        if (connectionAttempts < reconnectAttempts) {
          scheduleReconnect();
        } else {
          setError(`Failed to reconnect after ${reconnectAttempts} attempts`);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setIsConnecting(false);
        setError(`Connection failed: ${err.message}`);
        
        if (connectionAttempts < reconnectAttempts) {
          scheduleReconnect();
        }
      });

      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(`Socket error: ${err.message || err}`);
      });

      // Re-attach existing event listeners
      eventListenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket.on(event, callback);
        });
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to create socket:', err);
      setError(`Failed to initialize connection: ${err}`);
      setIsConnecting(false);
    }
  }, [url, query, connectionAttempts, reconnectAttempts]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect... (${connectionAttempts + 1}/${reconnectAttempts})`);
      connect();
    }, reconnectInterval);
  }, [connect, connectionAttempts, reconnectAttempts, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit '${event}': Socket not connected`);
    }
  }, []);

  // Add event listener
  const on = useCallback((event: string, callback: (data: any) => void) => {
    // Store callback reference
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)!.push(callback);

    // Add to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }

    // Remove from stored callbacks
    if (callback && eventListenersRef.current.has(event)) {
      const callbacks = eventListenersRef.current.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      eventListenersRef.current.delete(event);
    }
  }, []);

  // Send structured message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: new Date()
    };
    emit('message', messageWithTimestamp);
  }, [emit]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Handle visibility change (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && !isConnecting) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, isConnected, isConnecting]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && !isConnecting) {
        connect();
      }
    };

    const handleOffline = () => {
      setError('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, isConnected, isConnecting]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connectionAttempts,
    connect,
    disconnect,
    emit,
    on,
    off,
    sendMessage
  };
};