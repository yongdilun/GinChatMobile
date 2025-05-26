// GinChatMobile/src/services/RobustWebSocketService.ts
// Enhanced WebSocket service with better resilience for mobile networks

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
  id?: string; // For message tracking
}

interface QueuedMessage {
  message: WebSocketMessage;
  timestamp: number;
  retries: number;
}

const WS_BASE_URL = "wss://ginchat-14ry.onrender.com/api/ws";

class RobustWebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<(data: WebSocketMessage) => void> = new Set();
  private options?: WebSocketServiceOptions;
  private currentRoomId: string | null = null;
  private currentToken: string | null = null;

  // Enhanced connection management
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 8; // Increased for better reliability
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting: boolean = false;
  private isManualDisconnect: boolean = false;

  // Message queuing for reliability
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize: number = 100;
  private maxMessageRetries: number = 3;

  // Connection health monitoring
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private missedHeartbeats: number = 0;
  private maxMissedHeartbeats: number = 3;
  private lastPongTime: number = 0;

  // Adaptive reconnection
  private baseReconnectDelay: number = 2000; // Start with 2 seconds
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private connectionStableTime: number = 30000; // 30 seconds to consider stable
  private lastSuccessfulConnection: number = 0;

  // Network state tracking
  private consecutiveFailures: number = 0;
  private isNetworkAvailable: boolean = true;

  private defaultOptions: WebSocketServiceOptions = {
    onOpen: () => console.log("[RobustWS] Connection opened"),
    onMessage: (data) => console.log("[RobustWS] Message received:", data),
    onClose: (event) => console.log("[RobustWS] Connection closed:", event.code, event.reason),
    onError: (event) => console.error("[RobustWS] Error:", event.message),
  };

  public connect(roomId: string, token: string, options?: WebSocketServiceOptions): void {
    if (!roomId || !token) {
      console.error("[RobustWS] Room ID and token are required");
      return;
    }

    console.log("[RobustWS] Connecting to room:", roomId);

    // If already connected to same room, just trigger onOpen
    if (this.isConnected() && this.currentRoomId === roomId && this.currentToken === token) {
      console.log("[RobustWS] Already connected to same room");
      if (options?.onOpen) options.onOpen();
      return;
    }

    // Clean disconnect if switching rooms
    if (this.isConnected() && (this.currentRoomId !== roomId || this.currentToken !== token)) {
      console.log("[RobustWS] Switching rooms, disconnecting first");
      this.disconnect();
      setTimeout(() => this._initiateConnection(roomId, token, options), 1000);
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
    this.consecutiveFailures = 0;

    const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}&room_id=${encodeURIComponent(roomId)}`;
    this._establishConnection(url);
  }

  private _establishConnection(url: string): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error("[RobustWS] Max connection attempts reached");
      this._handleMaxAttemptsReached();
      return;
    }

    try {
      console.log(`[RobustWS] Attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts} - Connecting to ${url}`);
      console.log(`[RobustWS] Platform: ${Platform.OS}, Environment: ${__DEV__ ? 'Dev' : 'Prod'}`);

      this.ws = new WebSocket(url);
      this.connectionAttempts++;

      this.ws.onopen = () => this._handleOpen();
      this.ws.onmessage = (event) => this._handleMessage(event);
      this.ws.onclose = (event) => this._handleClose(event);
      this.ws.onerror = (error) => this._handleError(error);

    } catch (error) {
      console.error("[RobustWS] Error creating WebSocket:", error);
      this._scheduleReconnect();
    }
  }

  private _handleOpen(): void {
    console.log("[RobustWS] Connection established successfully");

    // Reset connection state
    this.connectionAttempts = 0;
    this.consecutiveFailures = 0;
    this.isReconnecting = false;
    this.lastSuccessfulConnection = Date.now();
    this.isNetworkAvailable = true;

    // Start health monitoring
    this._startHeartbeat();

    // Process queued messages
    this._processMessageQueue();

    // Mark connection as stable after 30 seconds
    setTimeout(() => {
      if (this.isConnected()) {
        console.log("[RobustWS] Connection stable for 30 seconds");
        this.connectionAttempts = 0; // Reset attempts after stable connection
      }
    }, this.connectionStableTime);

    if (this.options?.onOpen) {
      this.options.onOpen();
    }
  }

  private _handleMessage(event: WebSocketMessageEvent): void {
    try {
      let data: string;
      if (typeof event.data === 'string') {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        throw new Error('Unsupported message format');
      }

      const parsedData: WebSocketMessage = JSON.parse(data);
      console.log("[RobustWS] Message received:", parsedData.type);

      // Handle heartbeat response
      if (parsedData.type === 'heartbeat_ack' || parsedData.type === 'pong') {
        this.lastPongTime = Date.now();
        this.missedHeartbeats = 0;
        console.log("[RobustWS] Heartbeat acknowledged");
        return;
      }

      // Forward to message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(parsedData);
        } catch (handlerError) {
          console.error("[RobustWS] Error in message handler:", handlerError);
        }
      });

      if (this.options?.onMessage) {
        this.options.onMessage(parsedData);
      }

    } catch (error) {
      console.error("[RobustWS] Error parsing message:", error);
      if (this.options?.onError) {
        const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
        errorEvent.message = 'Error parsing message';
        this.options.onError(errorEvent);
      }
    }
  }

  private _handleClose(event: WebSocketCloseEvent): void {
    console.log(`[RobustWS] Connection closed - Code: ${event.code}, Reason: ${event.reason || 'None'}`);

    this._stopHeartbeat();

    if (this.options?.onClose) {
      this.options.onClose(event);
    }

    // Track failures
    if (event.code !== 1000) {
      this.consecutiveFailures++;
    }

    // Determine if we should reconnect
    const shouldReconnect = !this.isManualDisconnect &&
                           event.code !== 1000 && // Not normal closure
                           this.currentRoomId &&
                           this.currentToken &&
                           this.connectionAttempts < this.maxConnectionAttempts;

    if (shouldReconnect) {
      console.log("[RobustWS] Scheduling reconnection");
      this._scheduleReconnect();
    } else {
      console.log("[RobustWS] Not reconnecting:", {
        manual: this.isManualDisconnect,
        code: event.code,
        hasCredentials: !!(this.currentRoomId && this.currentToken),
        attempts: this.connectionAttempts,
        maxAttempts: this.maxConnectionAttempts
      });
    }
  }

  private _handleError(error: Event): void {
    const errorEvent = error as any;
    console.error("[RobustWS] WebSocket error:", errorEvent.message || 'Unknown error');

    if (this.options?.onError) {
      const mockErrorEvent: WebSocketErrorEvent = {
        ...errorEvent,
        message: errorEvent.message || 'WebSocket error occurred',
        type: 'error',
      } as WebSocketErrorEvent;
      this.options.onError(mockErrorEvent);
    }

    // Don't immediately reconnect on error - let close handler deal with it
    console.log("[RobustWS] Error occurred, waiting for close event");
  }

  private _scheduleReconnect(): void {
    if (this.isReconnecting || this.isManualDisconnect) {
      return;
    }

    this.isReconnecting = true;

    // Adaptive delay based on consecutive failures
    const baseDelay = this.baseReconnectDelay * Math.pow(1.5, this.consecutiveFailures);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);

    console.log(`[RobustWS] Reconnecting in ${Math.round(delay/1000)}s (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}, failures: ${this.consecutiveFailures})`);

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.currentRoomId && this.currentToken && !this.isManualDisconnect) {
        const url = `${WS_BASE_URL}?token=${encodeURIComponent(this.currentToken)}&room_id=${encodeURIComponent(this.currentRoomId)}`;
        this._establishConnection(url);
      } else {
        this.isReconnecting = false;
      }
    }, delay);
  }

  private _handleMaxAttemptsReached(): void {
    console.error("[RobustWS] Max connection attempts reached, giving up");
    this.isReconnecting = false;

    if (this.options?.onError) {
      const errorEvent = new Event('error') as unknown as WebSocketErrorEvent;
      errorEvent.message = 'Max connection attempts reached';
      this.options.onError(errorEvent);
    }
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();

    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected() && !this.isManualDisconnect) {
        this._sendHeartbeat();
      }
    }, 30000);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private _sendHeartbeat(): void {
    if (!this.isConnected()) return;

    try {
      const heartbeat: WebSocketMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now() }
      };

      this.ws!.send(JSON.stringify(heartbeat));
      console.log("[RobustWS] Heartbeat sent");

      // Set timeout for heartbeat response
      this.heartbeatTimeoutId = setTimeout(() => {
        this.missedHeartbeats++;
        console.warn(`[RobustWS] Missed heartbeat ${this.missedHeartbeats}/${this.maxMissedHeartbeats}`);

        if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
          console.error("[RobustWS] Too many missed heartbeats, forcing reconnection");
          this._forceReconnect();
        }
      }, 10000); // 10 second timeout for heartbeat response

    } catch (error) {
      console.error("[RobustWS] Error sending heartbeat:", error);
      this._forceReconnect();
    }
  }

  private _forceReconnect(): void {
    console.log("[RobustWS] Forcing reconnection due to health check failure");
    if (this.ws) {
      this.ws.close(1006, "Health check failed");
    }
  }

  private _processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`[RobustWS] Processing ${this.messageQueue.length} queued messages`);

    const messagesToProcess = [...this.messageQueue];
    this.messageQueue = [];

    messagesToProcess.forEach(queuedMessage => {
      if (queuedMessage.retries < this.maxMessageRetries) {
        this._sendMessageDirect(queuedMessage.message);
      } else {
        console.warn("[RobustWS] Dropping message after max retries:", queuedMessage.message);
      }
    });
  }

  private _queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove oldest message to make room
      this.messageQueue.shift();
      console.warn("[RobustWS] Message queue full, dropping oldest message");
    }

    this.messageQueue.push({
      message,
      timestamp: Date.now(),
      retries: 0
    });

    console.log(`[RobustWS] Message queued (${this.messageQueue.length}/${this.maxQueueSize})`);
  }

  private _sendMessageDirect(message: WebSocketMessage): boolean {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.ws!.send(messageStr);
      console.log("[RobustWS] Message sent:", message.type);
      return true;
    } catch (error) {
      console.error("[RobustWS] Error sending message:", error);
      return false;
    }
  }

  // Public methods
  public sendMessage(data: object): boolean {
    const message: WebSocketMessage = {
      type: 'chat_message',
      chatroom_id: this.currentRoomId || undefined,
      data: data,
      id: Date.now().toString() // Add ID for tracking
    };

    if (this.isConnected()) {
      return this._sendMessageDirect(message);
    } else {
      console.warn("[RobustWS] Not connected, queueing message");
      this._queueMessage(message);
      return false; // Indicate message was queued, not sent
    }
  }

  public disconnect(): void {
    console.log("[RobustWS] Manual disconnect initiated");
    this.isManualDisconnect = true;
    this.isReconnecting = false;

    this._stopHeartbeat();

    // Clear all timers
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, "Manual disconnect");
      } catch (error) {
        console.error("[RobustWS] Error closing connection:", error);
      }
    }

    // Reset state
    this.ws = null;
    this.currentRoomId = null;
    this.currentToken = null;
    this.connectionAttempts = 0;
    this.consecutiveFailures = 0;
    this.messageQueue = []; // Clear queued messages
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

  public getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  public getStats(): object {
    return {
      connectionState: this.getConnectionState(),
      connectionAttempts: this.connectionAttempts,
      consecutiveFailures: this.consecutiveFailures,
      queuedMessages: this.messageQueue.length,
      missedHeartbeats: this.missedHeartbeats,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      isReconnecting: this.isReconnecting
    };
  }
}

// Export singleton instance
const robustWebSocketService = new RobustWebSocketService();
export default robustWebSocketService;

// Type definitions
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
