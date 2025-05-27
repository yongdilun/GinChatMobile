// GinChatMobile/src/services/SimpleWebSocketService.ts
// SIMPLIFIED WebSocket Service - Clean and reliable

import { Platform } from 'react-native';

interface WebSocketServiceOptions {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: (event: WebSocketCloseEvent) => void;
  onError?: (event: WebSocketErrorEvent) => void;
}

interface WebSocketMessage {
  type: string;
  data: unknown;
  chatroom_id?: string;
}

// Production server URL
const WS_BASE_URL = "wss://ginchat-14ry.onrender.com/api/ws";

class SimpleWebSocketService {
  private ws: WebSocket | null = null;
  private currentRoomId: string | null = null;
  private currentToken: string | null = null;
  private messageHandlers: Set<(data: WebSocketMessage) => void> = new Set();
  private isConnecting: boolean = false;
  private isManualDisconnect: boolean = false;

  // Simple connection method - with proper connection management
  public connect(roomId: string, token: string, options?: WebSocketServiceOptions): void {
    if (!roomId || !token) {
      console.error("[SimpleWebSocketService] Room ID and token are required");
      return;
    }

    // If already connected to the same room, do nothing
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentRoomId === roomId) {
      console.log("[SimpleWebSocketService] Already connected to room:", roomId);
      if (options?.onOpen) options.onOpen();
      return;
    }

    // If connecting to a different room, disconnect first and wait
    if (this.ws && this.currentRoomId !== roomId) {
      console.log("[SimpleWebSocketService] Switching from", this.currentRoomId, "to", roomId);
      this.disconnect();
      // Wait a bit before connecting to new room to avoid 429 errors
      setTimeout(() => {
        this.connectToRoom(roomId, token, options);
      }, 1000);
      return;
    }

    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      console.log("[SimpleWebSocketService] Already connecting, ignoring request");
      return;
    }

    this.connectToRoom(roomId, token, options);
  }

  private connectToRoom(roomId: string, token: string, options?: WebSocketServiceOptions): void {
    this.isConnecting = true;
    this.isManualDisconnect = false;
    this.currentRoomId = roomId;
    this.currentToken = token;

    const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}&room_id=${encodeURIComponent(roomId)}`;
    console.log("[SimpleWebSocketService] Connecting to:", roomId);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[SimpleWebSocketService] ✅ Connected to room:", roomId);
        this.isConnecting = false;
        if (options?.onOpen) options.onOpen();
      };

      this.ws.onmessage = (event: WebSocketMessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
          const parsedData: WebSocketMessage = JSON.parse(data);

          // Handle heartbeat
          if (parsedData.type === 'heartbeat_ack') {
            return;
          }

          // Forward to all handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(parsedData);
            } catch (error) {
              console.error("[SimpleWebSocketService] Handler error:", error);
            }
          });

          if (options?.onMessage) {
            options.onMessage(parsedData);
          }
        } catch (error) {
          console.error("[SimpleWebSocketService] Message parse error:", error);
        }
      };

      this.ws.onclose = (event: WebSocketCloseEvent) => {
        console.log("[SimpleWebSocketService] ❌ Disconnected from room:", this.currentRoomId, "Code:", event.code);
        this.isConnecting = false;
        this.ws = null;

        if (options?.onClose) {
          options.onClose(event);
        }

        // Simple reconnection: only if not manual disconnect and connection was stable
        if (!this.isManualDisconnect && event.code !== 1000 && this.currentRoomId && this.currentToken) {
          console.log("[SimpleWebSocketService] 🔄 Reconnecting in 3 seconds...");
          setTimeout(() => {
            if (!this.isManualDisconnect && this.currentRoomId && this.currentToken) {
              this.connectToRoom(this.currentRoomId, this.currentToken, options);
            }
          }, 3000);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error("[SimpleWebSocketService] ❌ Connection error:", error);
        this.isConnecting = false;
        if (options?.onError) {
          options.onError(error as WebSocketErrorEvent);
        }
      };

    } catch (error) {
      console.error("[SimpleWebSocketService] ❌ Failed to create WebSocket:", error);
      this.isConnecting = false;
      if (options?.onError) {
        options.onError(new Event('error') as WebSocketErrorEvent);
      }
    }
  }

  // Simple disconnect method
  public disconnect(): void {
    console.log("[SimpleWebSocketService] 🔌 Disconnecting...");
    this.isManualDisconnect = true;
    this.isConnecting = false;

    if (this.ws) {
      try {
        this.ws.close(1000, "Manual disconnect");
      } catch (error) {
        console.error("[SimpleWebSocketService] Error closing connection:", error);
      }
    }

    this.ws = null;
    this.currentRoomId = null;
    this.currentToken = null;
  }

  // Send message
  public sendMessage(data: object): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[SimpleWebSocketService] Cannot send message - not connected");
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type: 'chat_message',
        chatroom_id: this.currentRoomId || undefined,
        data: data
      };
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[SimpleWebSocketService] Send error:", error);
      return false;
    }
  }

  // Message handlers
  public addMessageHandler(handler: (data: WebSocketMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  public removeMessageHandler(handler: (data: WebSocketMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  // Connection status
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getCurrentRoom(): string | null {
    return this.currentRoomId;
  }
}

// Export singleton
const simpleWebSocketService = new SimpleWebSocketService();
export default simpleWebSocketService;

// Event types
interface WebSocketErrorEvent extends Event {
  message?: string;
}

interface WebSocketCloseEvent extends Event {
  code: number;
  reason: string;
  wasClean: boolean;
}

interface WebSocketMessageEvent extends Event {
  data: string | ArrayBuffer | Blob;
}
