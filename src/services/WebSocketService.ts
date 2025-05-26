// GinChatMobile/src/services/WebSocketService.ts

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

  // Always use production server URL since we're not running locally
  const WS_BASE_URL = "wss://ginchat-14ry.onrender.com/api/ws"; // Production server

  class WebSocketService {
    private ws: WebSocket | null = null;
    private messageHandlers: Set<(data: WebSocketMessage) => void> = new Set();
    private options?: WebSocketServiceOptions;
    private currentRoomId: string | null = null;
    private currentToken: string | null = null;
    private connectionAttempts: number = 0;
    private maxConnectionAttempts: number = 3; // Reduced to prevent endless loops
    private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private isReconnecting: boolean = false;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private isManualDisconnect: boolean = false;
    private connectionStabilityTimer: ReturnType<typeof setTimeout> | null = null;
    private consecutiveFailures: number = 0;
    private lastConnectionAttempt: number = 0; // Track last connection attempt
    private connectionThrottleMs: number = 3000; // FIXED: Minimum 3 seconds between connections to prevent rapid conflicts

    private defaultOptions: WebSocketServiceOptions = {
      onOpen: () => console.log("[WebSocketService] Connection opened."),
      onMessage: (data) => console.log("[WebSocketService] Message received:", data),
      onClose: (event) => console.log("[WebSocketService] Connection closed.", event.code, event.reason),
      onError: (event) => console.error("[WebSocketService] Error:", event.message),
    };

    public connect(roomId: string, token: string, options?: WebSocketServiceOptions): void {
      if (!roomId || !token) {
        console.error("[WebSocketService] Room ID and token are required");
        return;
      }

      // Throttle connections to prevent spam
      const now = Date.now();
      if (now - this.lastConnectionAttempt < this.connectionThrottleMs) {
        console.log(`[WebSocketService] Connection throttled. Last attempt was ${now - this.lastConnectionAttempt}ms ago. Minimum interval: ${this.connectionThrottleMs}ms`);
        return;
      }
      this.lastConnectionAttempt = now;

      console.log("[WebSocketService] Attempting to connect with roomId:", roomId);

      // Check if we're already connected to the same room
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (this.currentRoomId === roomId && this.currentToken === token) {
          console.log("[WebSocketService] Already connected to the same room with the same token.");
          if (this.options?.onOpen) this.options.onOpen();
          return;
        }
        console.log("[WebSocketService] Switching to new room, keeping connection alive");
        // Don't disconnect aggressively, just update room info
        this.currentRoomId = roomId;
        this.currentToken = token;
        this.disconnect();

        // FIXED: Longer delay for room switching to prevent connection conflicts
        setTimeout(() => {
          this._initiateConnection(roomId, token, options);
        }, 1000); // Increased from 500ms to 1000ms to prevent rapid connection conflicts
        return;
      }

      this._initiateConnection(roomId, token, options);
    }

    private _initiateConnection(roomId: string, token: string, options?: WebSocketServiceOptions): void {
      this.currentRoomId = roomId;
      this.currentToken = token;
      this.options = { ...this.defaultOptions, ...options };
      this.connectionAttempts = 0;
      this.isReconnecting = false;
      this.isManualDisconnect = false;

      const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}&room_id=${encodeURIComponent(roomId)}`;
      console.log(`[WebSocketService] Connecting to WebSocket URL: ${url}`);

      this._establishConnection(url);
    }

    private _establishConnection(url: string): void {
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
          console.error("[WebSocketService] Max connection attempts reached.");
          if (this.options?.onError) {
              const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
              errorEvent.message = 'Max connection attempts reached.';
              this.options.onError(errorEvent);
          }
          return;
      }

      try {
        console.log(`[WebSocketService] Attempting to connect to ${url} (${__DEV__ ? 'Development' : 'Production'} environment)`);
        console.log(`[WebSocketService] Platform: ${Platform.OS}, Running on: ${__DEV__ ? 'Development' : 'Production'}`);

        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log("[WebSocketService] Connection established successfully");
          console.log("[WebSocketService] WebSocket readyState:", this.ws?.readyState);
          console.log("[WebSocketService] Connection URL:", url.substring(0, 100) + "...");
          this.connectionAttempts = 0;
          this.consecutiveFailures = 0; // Reset failure count on successful connection
          this.isReconnecting = false;

          // Clear any existing stability timer
          if (this.connectionStabilityTimer) {
            clearTimeout(this.connectionStabilityTimer);
          }

          // Set a stability timer - if connection stays open for 10 seconds, consider it stable
          this.connectionStabilityTimer = setTimeout(() => {
            console.log("[WebSocketService] Connection stable for 10 seconds");
            this.connectionAttempts = 0; // Reset attempts after stable connection
            this.consecutiveFailures = 0; // Reset failure count after stable connection
          }, 10000);

          // Start heartbeat after successful connection
          this.startHeartbeat();

          if (this.options?.onOpen) {
            this.options.onOpen();
          }
        };

        this.ws.onmessage = (event: WebSocketMessageEvent) => {
          try {
            let data: string;
            if (typeof event.data === 'string') {
              data = event.data;
            } else if (event.data instanceof ArrayBuffer) {
              data = new TextDecoder().decode(event.data);
            } else {
              throw new Error('Unsupported message format');
            }

            console.log("[WebSocketService] Received message:", data.substring(0, 100) + (data.length > 100 ? '...' : ''));
            const parsedData: WebSocketMessage = JSON.parse(data);

            // Handle heartbeat acknowledgment
            if (parsedData.type === 'heartbeat_ack') {
              console.log("[WebSocketService] Received heartbeat acknowledgment");
              return;
            }

            // Handle all message types including new, edit, delete, chatroom events, and unread counts
            if (parsedData.type === 'new_message' ||
                parsedData.type === 'chat_message' ||
                parsedData.type === 'message_updated' ||
                parsedData.type === 'message_deleted' ||
                parsedData.type === 'chatroom_deleted' ||
                parsedData.type === 'message_read' ||
                parsedData.type === 'unread_count_update') {
              console.log(`[WebSocketService] Message received: ${JSON.stringify(parsedData)}`);
              this.messageHandlers.forEach(handler => {
                try {
                  handler(parsedData);
                } catch (handlerError) {
                  console.error("[WebSocketService] Error in message handler:", handlerError);
                }
              });
            }

            if (this.options?.onMessage) {
              this.options.onMessage(parsedData);
            }
          } catch (e) {
            console.error("[WebSocketService] Error parsing message:", e);
            if (this.options?.onError) {
               const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
               errorEvent.message = 'Error parsing message';
               this.options.onError(errorEvent);
            }
          }
        };

        this.ws.onclose = (event: WebSocketCloseEvent) => {
          console.log("[WebSocketService] Connection closed. Code:", event.code, "Reason:", event.reason);
          this.stopHeartbeat();

          // Clear stability timer
          if (this.connectionStabilityTimer) {
            clearTimeout(this.connectionStabilityTimer);
            this.connectionStabilityTimer = null;
          }

          if (this.options?.onClose) {
            this.options.onClose(event);
          }

          // Track consecutive failures
          if (event.code !== 1000) {
            this.consecutiveFailures++;
          }

          // Only reconnect if:
          // 1. Not a manual disconnect (code 1000)
          // 2. Not already reconnecting
          // 3. We have room and token info
          // 4. Connection was not manually closed
          // 5. We haven't exceeded max attempts
          const shouldReconnect = !this.isManualDisconnect &&
                                 !this.isReconnecting &&
                                 event.code !== 1000 &&
                                 this.currentRoomId &&
                                 this.currentToken &&
                                 this.connectionAttempts < this.maxConnectionAttempts;

          if (shouldReconnect) {
            console.log("[WebSocketService] Initiating reconnection after close");
            this.handleReconnect();
          } else {
            console.log("[WebSocketService] Not reconnecting:", {
              isManualDisconnect: this.isManualDisconnect,
              isReconnecting: this.isReconnecting,
              code: event.code,
              hasRoomAndToken: !!(this.currentRoomId && this.currentToken),
              attempts: this.connectionAttempts,
              maxAttempts: this.maxConnectionAttempts,
              consecutiveFailures: this.consecutiveFailures
            });
          }
        };

        this.ws.onerror = (error: Event) => {
          const errorEvent = error as any;
          console.error("[WebSocketService] WebSocket error:", errorEvent.message || error);
          console.log("[WebSocketService] Error details - readyState:", this.ws?.readyState);
          console.log("[WebSocketService] Error details - isReconnecting:", this.isReconnecting);
          console.log("[WebSocketService] Error details - connectionAttempts:", this.connectionAttempts);

          if (this.options?.onError) {
            const mockErrorEvent: WebSocketErrorEvent = {
              ...errorEvent,
              message: errorEvent.message || 'WebSocket error occurred',
              type: 'error',
              target: errorEvent.target,
              timeStamp: errorEvent.timeStamp,
            } as WebSocketErrorEvent;
            this.options.onError(mockErrorEvent);
          }

          // Don't immediately reconnect on error - let the close handler deal with it
          // This prevents double reconnection attempts
          console.log("[WebSocketService] Error occurred, waiting for close event to handle reconnection");
        };
      } catch (error) {
          console.error("[WebSocketService] Error creating WebSocket:", error);
          if (this.options?.onError) {
              const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
              errorEvent.message = 'Failed to create WebSocket connection';
              this.options.onError(errorEvent);
          }
          if (!this.isReconnecting) {
            console.log("[WebSocketService] Initiating reconnection after creation error");
            this.handleReconnect();
          }
      }
    }

    private startHeartbeat(): void {
      // Clear any existing heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Send heartbeat every 60 seconds (less aggressive)
      this.heartbeatInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isManualDisconnect) {
          const heartbeatMsg: WebSocketMessage = {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() }
          };
          try {
            this.ws.send(JSON.stringify(heartbeatMsg));
            console.log("[WebSocketService] Heartbeat sent");
          } catch (error) {
            console.error("[WebSocketService] Error sending heartbeat:", error);
          }
        }
      }, 60000); // 60 seconds instead of 45
    }

    private stopHeartbeat(): void {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }

    private handleReconnect(): void {
      if (this.isReconnecting || !this.currentRoomId || !this.currentToken) {
        return;
      }

      this.isReconnecting = true;
      this.connectionAttempts++;

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.error("[WebSocketService] Max reconnection attempts reached");
        this.isReconnecting = false;
        return;
      }

      // Less aggressive reconnection to prevent connection storms: 10s, 20s, 30s (max)
      const delay = Math.min(10000 + (this.connectionAttempts * 10000), 30000);
      console.log(`[WebSocketService] Attempting to reconnect in ${delay/1000}s (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);

      this.reconnectTimeoutId = setTimeout(() => {
        if (this.currentRoomId && this.currentToken && !this.isManualDisconnect) {
          const url = `${WS_BASE_URL}?token=${encodeURIComponent(this.currentToken)}&room_id=${encodeURIComponent(this.currentRoomId)}`;
          this._establishConnection(url);
        } else {
          this.isReconnecting = false;
        }
      }, delay);
    }

    public disconnect(): void {
      console.log("[WebSocketService] Manual disconnect initiated");
      this.isManualDisconnect = true;
      this.isReconnecting = false;
      this.stopHeartbeat();

      // Clear all timers
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      if (this.connectionStabilityTimer) {
        clearTimeout(this.connectionStabilityTimer);
        this.connectionStabilityTimer = null;
      }

      if (this.ws) {
        console.log("[WebSocketService] Closing WebSocket connection...");
        try {
          this.ws.close(1000, "Manual disconnection");
        } catch (error) {
          console.error("[WebSocketService] Error closing connection:", error);
        }
      }

      // Reset all state
      this.ws = null;
      this.currentRoomId = null;
      this.currentToken = null;
      this.connectionAttempts = 0;
      this.consecutiveFailures = 0;
    }

    public sendMessage(data: object): boolean {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn("[WebSocketService] Cannot send message, WebSocket is not open.");
        return false;
      }

      try {
        const message: WebSocketMessage = {
          type: 'chat_message',
          chatroom_id: this.currentRoomId || undefined,
          data: data
        };

        const messageStr = JSON.stringify(message);
        console.log("[WebSocketService] Sending message:", messageStr);
        this.ws.send(messageStr);
          return true;
        } catch (error) {
          console.error("[WebSocketService] Error sending message:", error);
          if (this.options?.onError) {
              const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
              errorEvent.message = 'Error sending message';
              this.options.onError(errorEvent);
          }
          return false;
        }
    }

    public addMessageHandler(handler: (data: WebSocketMessage) => void): void {
      this.messageHandlers.add(handler);
    }

    public removeMessageHandler(handler: (data: WebSocketMessage) => void): void {
      this.messageHandlers.delete(handler);
    }

    public isConnected(): boolean {
      return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
  }

  // Export a singleton instance
  const webSocketService = new WebSocketService();
  export default webSocketService;

  // Define WebSocket event types if not globally available (common in React Native)
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
