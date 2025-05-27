import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleWebSocket, WebSocketMessage as WSMessage } from '@/contexts/SimpleWebSocketContext';
import { Message } from '@/services/api';

// Use the same API URL as the rest of the app
const API_URL = 'https://ginchat-14ry.onrender.com/api';

interface AppWebSocketMessage {
  type: string;
  data: any;
  chatroom_id?: string;
}

interface UseWebSocketHandlerProps {
  chatroomId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  markMessageAsRead: (messageId: string) => Promise<void>;
}

export function useWebSocketHandler({ 
  chatroomId, 
  setMessages, 
  markMessageAsRead 
}: UseWebSocketHandlerProps) {
  const { user } = useAuth();
  const { connectToRoom, connectToSidebar, addMessageHandler, removeMessageHandler } = useSimpleWebSocket();
  const processedMessages = useRef(new Set<string>());

  // WebSocket message handler
  const handleIncomingMessage = useCallback((newMessage: AppWebSocketMessage | WSMessage) => {
    console.log('[Chat] Received WebSocket message:', newMessage);

    if ('data' in newMessage && newMessage.data && typeof newMessage.data === 'object') {
      const messageType = newMessage.type;

      if (messageType === 'message_updated') {
        // Handle message edit
        const updatedMessage = newMessage.data as Message;
        console.log('[Chat] Message updated:', updatedMessage);

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === updatedMessage.id ? { ...updatedMessage, edited: true } : msg
          )
        );
      } else if (messageType === 'message_deleted') {
        // Handle message deletion
        const { message_id } = newMessage.data as { message_id: string; chatroom_id: string };
        console.log('[Chat] Message deleted:', message_id);

        setMessages(prevMessages =>
          prevMessages.filter(msg => msg.id !== message_id)
        );
      } else if (messageType === 'chatroom_deleted') {
        // Handle chatroom deletion
        const { chatroom_id } = newMessage.data as { chatroom_id: string };
        console.log('[Chat] Chatroom deleted:', chatroom_id);

        if (chatroom_id === chatroomId) {
          Alert.alert(
            'Chatroom Deleted',
            'This chatroom has been deleted by the creator.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else if (messageType === 'message_read') {
        // Handle read status updates from WebSocket with chatroom filtering
        if (newMessage.chatroom_id === chatroomId) {
          const readData = newMessage.data as {
            message_id?: string;
            read_status?: any[];
            user_id?: number;
            type?: string;
            chatroom_id?: string;
            read_all?: boolean;
          };

          console.log('[Chat] 📝 Read status update received for current chatroom:', readData);

          // Handle individual message read status update
          if (readData.message_id && readData.read_status) {
            console.log('[Chat] 📝 Processing read status update for message:', readData.message_id, '(reader:', readData.user_id, ')');

            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === readData.message_id
                  ? { ...msg, read_status: readData.read_status }
                  : msg
              )
            );
          }
        } else {
          console.log('[Chat] 📝 Ignoring read status update for different chatroom:', newMessage.chatroom_id, 'vs current:', chatroomId);
        }
      } else if (messageType === 'new_message' || messageType === 'chat_message') {
        // Handle new message with optimistic updates
        console.log('[Chat] 📝 New message received');
        const messageData = newMessage.data as Message;

        if (messageData.id && !processedMessages.current.has(messageData.id)) {
          processedMessages.current.add(messageData.id);

          // Add message to UI immediately
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg.id === messageData.id);
            if (!messageExists) {
              const updatedMessages = [messageData, ...prevMessages];
              return updatedMessages.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
            }
            return prevMessages;
          });

          // Auto-mark new messages as read if from others
          if (messageData.sender_id !== user?.id && messageData.id) {
            console.log('[Chat] 📝 Auto-marking new message as read:', messageData.id);
            markMessageAsRead(messageData.id);
          }
        }
      }
    }
  }, [chatroomId, user?.id, setMessages, markMessageAsRead]);

  // Connect to chat room WebSocket
  useEffect(() => {
    if (chatroomId && user?.id) {
      console.log('[Chat] 🔌 Connecting to WebSocket room:', chatroomId);

      // Add message handler and connect to room
      addMessageHandler(handleIncomingMessage);
      connectToRoom(chatroomId);

      return () => {
        console.log('[Chat] 🔌 Cleaning up WebSocket connection for room:', chatroomId);
        removeMessageHandler(handleIncomingMessage);
        // Reconnect to sidebar when leaving chat room
        connectToSidebar();
      };
    }
  }, [chatroomId, user?.id, handleIncomingMessage, addMessageHandler, removeMessageHandler, connectToRoom, connectToSidebar]);

  return {
    processedMessages,
  };
}
