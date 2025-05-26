// GinChatMobile/src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import robustWebSocketService from '@/services/RobustWebSocketService'; // Import the new robust service
import { useAuth } from './AuthContext'; // To get the token
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of the WebSocket message for context consumers
export interface WebSocketMessage {
  type: string;
  data: any;
  chatroom_id?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectToRoom: (roomId: string) => void;
  disconnectFromRoom: () => void;
  addMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
  removeMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
  sendMessage: (data: object) => boolean; // Allow sending generic messages if needed
  getConnectionState: () => string;
  getStats: () => object;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(robustWebSocketService.isConnected());
  const { token } = useAuth();
  const currentRoomIdRef = useRef<string | null>(null);

  const handleOpen = useCallback(() => {
    console.log("[WebSocketContext] WebSocket connected successfully");
    setIsConnected(true);
  }, []);

  const handleClose = useCallback((event: WebSocketCloseEvent) => {
    console.log("[WebSocketContext] WebSocket disconnected.", event.code, event.reason);
    setIsConnected(false);

    // Log close reason for debugging
    if (event.code === 1006) {
      console.log("[WebSocketContext] Abnormal closure detected (1006) - this is common on mobile networks");
    } else if (event.code === 1000) {
      console.log("[WebSocketContext] Normal closure (1000) - manual disconnect");
    }
  }, []);

  const handleError = useCallback((event: WebSocketErrorEvent) => {
    console.error("[WebSocketContext] WebSocket error:", event.message || "WebSocket error occurred");
    // Don't immediately set disconnected - let the close handler deal with it
    // This prevents rapid state changes
  }, []);

  const connectToRoom = useCallback(async (roomId: string) => {
    if (!token) {
      console.error("[WebSocketContext] Cannot connect: auth token not available");
      return;
    }
    if (!roomId) {
      console.error("[WebSocketContext] Cannot connect: roomId not provided");
      return;
    }

    try {
      console.log(`[WebSocketContext] Connecting to room ${roomId} with token available: ${!!token}`);

      // Store the current room ID
      currentRoomIdRef.current = roomId;
      await AsyncStorage.setItem('lastConnectedRoom', roomId);

      robustWebSocketService.connect(roomId, token, {
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
      });
    } catch (error) {
      console.error("[WebSocketContext] Error connecting to room:", error);
    }
  }, [token, handleOpen, handleClose, handleError]);

  const disconnectFromRoom = useCallback(() => {
    console.log("[WebSocketContext] Disconnecting from room");
    currentRoomIdRef.current = null;
    AsyncStorage.removeItem('lastConnectedRoom').catch(console.error);
    robustWebSocketService.disconnect();
    setIsConnected(false);
  }, []);

  const addMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    robustWebSocketService.addMessageHandler(handler);
  }, []);

  const removeMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    robustWebSocketService.removeMessageHandler(handler);
  }, []);

  const sendMessage = useCallback((data: object): boolean => {
    return robustWebSocketService.sendMessage(data);
  }, []);

  const getConnectionState = useCallback((): string => {
    return robustWebSocketService.getConnectionState();
  }, []);

  const getStats = useCallback((): object => {
    return robustWebSocketService.getStats();
  }, []);

  // Effect to update connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const currentStatus = robustWebSocketService.isConnected();
      if (isConnected !== currentStatus) {
        console.log(`[WebSocketContext] Connection status changed: ${currentStatus}`);
        setIsConnected(currentStatus);
      }
    };

    // Check status less frequently to reduce overhead
    const intervalId = setInterval(checkConnectionStatus, 10000); // Increased from 5s to 10s
    checkConnectionStatus(); // Initial check

    return () => clearInterval(intervalId);
  }, [isConnected]);

  // Effect to handle reconnection on token change
  useEffect(() => {
    const reconnectToLastRoom = async () => {
      if (token && !robustWebSocketService.isConnected()) {
        try {
          // Try to get the last connected room
          const lastRoom = await AsyncStorage.getItem('lastConnectedRoom');
          if (lastRoom) {
            console.log("[WebSocketContext] Attempting to reconnect to last room:", lastRoom);
            connectToRoom(lastRoom);
          }
        } catch (error) {
          console.error("[WebSocketContext] Error reconnecting to last room:", error);
        }
      }
    };

    if (token) {
      console.log("[WebSocketContext] Token available, checking for reconnection");
      reconnectToLastRoom();
    } else {
      console.log("[WebSocketContext] No token available, skipping reconnection");
    }

    // Cleanup on unmount or when token changes
    return () => {
      if (currentRoomIdRef.current) {
        console.log("[WebSocketContext] Cleaning up WebSocket connection");
        robustWebSocketService.disconnect();
      }
    };
  }, [token, connectToRoom]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectToRoom,
        disconnectFromRoom,
        addMessageHandler,
        removeMessageHandler,
        sendMessage,
        getConnectionState,
        getStats,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Define WebSocket event types if not globally available (common in React Native)
interface WebSocketErrorEvent extends Event {
  message?: string;
}

interface WebSocketCloseEvent extends Event {
  code: number;
  reason: string;
  wasClean: boolean;
}

