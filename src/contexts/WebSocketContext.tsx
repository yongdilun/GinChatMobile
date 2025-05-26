// GinChatMobile/src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import webSocketService from '@/services/WebSocketService'; // Import the original service
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
  connectToSidebar: () => void; // New: Connect to sidebar for global updates
  disconnectFromSidebar: () => void; // New: Disconnect from sidebar
  currentRoomId: string | null; // New: Track current room
  addMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
  removeMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
  sendMessage: (data: object) => boolean; // Allow sending generic messages if needed
  getConnectionState: () => string;
  getStats: () => object;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected());
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
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
      setCurrentRoomId(roomId);
      await AsyncStorage.setItem('lastConnectedRoom', roomId);

      webSocketService.connect(roomId, token, {
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
      });
    } catch (error) {
      console.error("[WebSocketContext] Error connecting to room:", error);
    }
  }, [token, handleOpen, handleClose, handleError]);

  const connectToSidebar = useCallback(async () => {
    if (!token) {
      console.error("[WebSocketContext] Cannot connect to sidebar: auth token not available");
      return;
    }

    try {
      console.log("[WebSocketContext] Connecting to sidebar for global updates");

      // Connect to a special "global" room for sidebar updates (backend expects valid room ID)
      const sidebarRoomId = "global_sidebar";
      currentRoomIdRef.current = sidebarRoomId;
      setCurrentRoomId(sidebarRoomId);
      await AsyncStorage.setItem('lastConnectedRoom', sidebarRoomId);

      webSocketService.connect(sidebarRoomId, token, {
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
      });
    } catch (error) {
      console.error("[WebSocketContext] Error connecting to sidebar:", error);
    }
  }, [token, handleOpen, handleClose, handleError]);

  const disconnectFromRoom = useCallback(() => {
    console.log("[WebSocketContext] Disconnecting from room");
    currentRoomIdRef.current = null;
    setCurrentRoomId(null);
    AsyncStorage.removeItem('lastConnectedRoom').catch(console.error);
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  const disconnectFromSidebar = useCallback(() => {
    console.log("[WebSocketContext] Disconnecting from sidebar");
    currentRoomIdRef.current = null;
    setCurrentRoomId(null);
    AsyncStorage.removeItem('lastConnectedRoom').catch(console.error);
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  const addMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    webSocketService.addMessageHandler(handler);
  }, []);

  const removeMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    webSocketService.removeMessageHandler(handler);
  }, []);

  const sendMessage = useCallback((data: object): boolean => {
    return webSocketService.sendMessage(data);
  }, []);

  const getConnectionState = useCallback((): string => {
    return webSocketService.isConnected() ? 'CONNECTED' : 'DISCONNECTED';
  }, []);

  const getStats = useCallback((): object => {
    return {
      isConnected: webSocketService.isConnected(),
      connectionState: webSocketService.isConnected() ? 'CONNECTED' : 'DISCONNECTED'
    };
  }, []);

  // Effect to update connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const currentStatus = webSocketService.isConnected();
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
      if (token && !webSocketService.isConnected()) {
        try {
          // Try to get the last connected room
          const lastRoom = await AsyncStorage.getItem('lastConnectedRoom');
          if (lastRoom) {
            console.log("[WebSocketContext] Attempting to reconnect to last room:", lastRoom);
            // Only auto-reconnect to sidebar or if explicitly requested
            if (lastRoom === 'global_sidebar') {
              console.log("[WebSocketContext] Auto-reconnecting to sidebar");
              connectToSidebar();
            } else {
              console.log("[WebSocketContext] Skipping auto-reconnection to chat room, let pages handle their own connections");
              // Don't auto-reconnect to specific chat rooms
              // Let individual pages (chat page, chats page) handle their own connections
            }
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
        webSocketService.disconnect();
      }
    };
  }, [token, connectToSidebar]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectToRoom,
        disconnectFromRoom,
        connectToSidebar,
        disconnectFromSidebar,
        currentRoomId,
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

