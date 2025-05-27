import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { chatAPI, Message, Chatroom, MessageType, mediaAPI, ReadStatus } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { GoldTheme } from '../../constants/GoldTheme';
import { GoldButton } from '../../src/components/GoldButton';
import { MessageActions } from '../../src/components/MessageActions';
import { ChatroomActions } from '../../src/components/ChatroomActions';

// Import our extracted components
import { AudioPlayer } from '../../src/components/chat/AudioPlayer';
import { ChatDetailHeader } from '../../src/components/chat/ChatDetailHeader';
import { VideoPlayer } from '../../src/components/chat/VideoPlayer';
import { MessageItem } from '../../src/components/chat/MessageItem';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { ImageModal } from '../../src/components/chat/ImageModal';
import { useWebSocketHandler } from '../../src/hooks/useWebSocketHandler';
import { useMediaPicker } from '../../src/hooks/useMediaPicker';

// Use the same API URL as the rest of the app
const API_URL = 'https://ginchat-14ry.onrender.com/api';

// Debounce utility to prevent spam calls
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface AppWebSocketMessage {
  type: string;
  data: any;
  chatroom_id?: string;
}

export default function ChatDetail() {
  const { id: chatroomId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  // State management
  const [chatroom, setChatroom] = useState<Chatroom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Media picker hook
  const {
    selectedMedia,
    pickingMedia,
    handlePickMedia,
    handleRemoveMedia,
    setSelectedMedia,
  } = useMediaPicker();

  // Mark message as read function
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    console.log('[Chat] 🚀 Optimistic mark message as read:', messageId);

    // Optimistic update - mark message as read immediately in UI
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          const updatedReadStatus = msg.read_status ? [...msg.read_status] : [];

          // Check if user already read this message
          const existingReadIndex = updatedReadStatus.findIndex(rs => rs.user_id === user.id);

          if (existingReadIndex === -1) {
            // Add new read status
            updatedReadStatus.push({
              user_id: user.id,
              username: user.username,
              read_at: new Date().toISOString()
            });
          }

          return { ...msg, read_status: updatedReadStatus };
        }
        return msg;
      })
    );

    // Make API call
    try {
      const response = await fetch(`${API_URL}/messages/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message_id: messageId }),
      });

      if (!response.ok) {
        console.error('[Chat] ❌ Failed to mark message as read:', response.status);
        // Revert optimistic update on failure
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.id === messageId) {
              const revertedReadStatus = msg.read_status?.filter(rs => rs.user_id !== user.id) || [];
              return { ...msg, read_status: revertedReadStatus };
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error('[Chat] ❌ Error marking message as read:', error);
    }
  }, [user?.id, user?.username, user?.access_token]);

  // WebSocket handler
  const { processedMessages } = useWebSocketHandler({
    chatroomId,
    setMessages,
    markMessageAsRead,
  });

  // Mark all messages as read
  const markAllMessagesAsRead = async () => {
    if (!chatroomId || !user?.id || isMarkingAsRead) {
      return;
    }

    setIsMarkingAsRead(true);

    try {
      // Optimistic update - mark all messages as read immediately
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.sender_id !== user.id) {
            const updatedReadStatus = msg.read_status ? [...msg.read_status] : [];
            const existingReadIndex = updatedReadStatus.findIndex(rs => rs.user_id === user.id);

            if (existingReadIndex === -1) {
              updatedReadStatus.push({
                user_id: user.id,
                username: user.username,
                read_at: new Date().toISOString()
              });
            }

            return { ...msg, read_status: updatedReadStatus };
          }
          return msg;
        })
      );

      const response = await fetch(`${API_URL}/chatrooms/${chatroomId}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[Chat] ❌ Failed to mark all messages as read:', response.status);
      }
    } catch (error) {
      console.error('[Chat] ❌ Error marking all messages as read:', error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Load chatroom and messages
  const loadChatroomData = async () => {
    if (!chatroomId || !user?.access_token) return;

    try {
      setLoading(true);

      // Load chatroom details
      const chatroomResponse = await chatAPI.getChatroom(chatroomId);
      setChatroom(chatroomResponse);

      // Load messages
      const messagesResponse = await chatAPI.getMessages(chatroomId);
      const sortedMessages = messagesResponse.sort((a, b) =>
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );
      setMessages(sortedMessages);

      // Mark all messages as read when entering chat
      setTimeout(() => {
        markAllMessagesAsRead();
      }, 500);

    } catch (error) {
      console.error('[Chat] Error loading chatroom data:', error);
      Alert.alert('Error', 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when chatroomId changes
  useEffect(() => {
    loadChatroomData();
  }, [chatroomId, user?.access_token]);

  // Focus effect to mark messages as read when returning to chat
  useFocusEffect(
    useCallback(() => {
      if (chatroomId && user?.access_token) {
        setTimeout(() => {
          markAllMessagesAsRead();
        }, 300);
      }
    }, [chatroomId, user?.access_token])
  );

  // Send message function
  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedMedia) || sending || isUploading) return;

    try {
      setSending(true);
      let mediaUrl: string | null = null;
      let messageType: MessageType = 'text';

      if (selectedMedia) {
        setIsUploading(true);
        try {
          const uploadResult = await mediaAPI.uploadMedia({
            uri: selectedMedia.uri,
            type: selectedMedia.mimeType,
            name: selectedMedia.name,
          }, selectedMedia.backendType || 'picture');
          mediaUrl = uploadResult.media_url;
          messageType = selectedMedia.backendType as MessageType || 'picture';
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Upload Failed', 'Could not upload media. Please try again.');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Determine final message type
      if (messageText.trim() && mediaUrl) {
        messageType = `text_and_${selectedMedia?.backendType || 'picture'}` as MessageType;
      } else if (mediaUrl) {
        messageType = selectedMedia?.backendType as MessageType || 'picture';
      } else {
        messageType = 'text';
      }

      const messageData = {
        chatroom_id: chatroomId!,
        text_content: messageText.trim() || null,
        media_url: mediaUrl,
        message_type: messageType,
      };

      await chatAPI.sendMessage(messageData);

      // Clear input
      setMessageText('');
      setSelectedMedia(null);

      // Scroll to top (newest message)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Get user gradient for message styling
  const getUserGradient = (username: string) => {
    const colors = [
      ['#FFD700', '#FFA500'] as const,
      ['#DAA520', '#B8860B'] as const,
      ['#F4E4BC', '#D4AF37'] as const,
      ['#FFED4E', '#FFD700'] as const,
      ['#FFA500', '#FF8C00'] as const,
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get read status for messages
  const getReadStatus = (message: Message) => {
    if (!message.read_status || message.read_status.length === 0) {
      return { icon: 'checkmark', color: '#888', title: 'Sent' };
    }

    const totalMembers = chatroom?.members?.length || 0;
    const readCount = message.read_status.length;

    if (readCount >= totalMembers - 1) { // -1 because sender doesn't count
      return { icon: 'checkmark-done', color: GoldTheme.gold.primary, title: 'Read by all' };
    } else {
      return { icon: 'checkmark', color: '#888', title: `Read by ${readCount}` };
    }
  };

  // Handle message long press
  const handleMessageLongPress = (message: Message) => {
    if (message.sender_id === user?.id) {
      setSelectedMessage(message);
    }
  };

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Handle three dot menu press
  const handleThreeDotPress = () => {
    // This will be handled by ChatroomActions component
  };

  // Render message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const userGradient = isOwnMessage ? null : getUserGradient(item.sender_name);

    return (
      <MessageItem
        item={item}
        isOwnMessage={isOwnMessage}
        userGradient={userGradient}
        onImageClick={handleImageClick}
        onLongPress={handleMessageLongPress}
        getReadStatus={getReadStatus}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <LinearGradient
        colors={[GoldTheme.background.primary, GoldTheme.background.secondary]}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" backgroundColor={GoldTheme.background.primary} />
        <ActivityIndicator size="large" color={GoldTheme.gold.primary} />
      </LinearGradient>
    );
  }

  // Error state - no chatroom ID
  if (!chatroomId) {
    return (
      <LinearGradient
        colors={[GoldTheme.background.primary, GoldTheme.background.secondary]}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" backgroundColor={GoldTheme.background.primary} />
        <GoldButton title="Go Back" onPress={() => router.back()} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GoldTheme.background.primary} />

      {/* Header */}
      <ChatDetailHeader
        chatroom={chatroom}
        messages={messages}
        onThreeDotPress={handleThreeDotPress}
      />

      {/* Messages List */}
      <LinearGradient
        colors={[GoldTheme.background.primary, GoldTheme.background.secondary]}
        style={styles.messagesContainer}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          inverted
          onEndReachedThreshold={0.1}
        />
      </LinearGradient>

      {/* Message Input */}
      <MessageInput
        messageText={messageText}
        setMessageText={setMessageText}
        selectedMedia={selectedMedia}
        onPickMedia={handlePickMedia}
        onRemoveMedia={handleRemoveMedia}
        onSendMessage={sendMessage}
        sending={sending}
        pickingMedia={pickingMedia}
        isUploading={isUploading}
      />

      {/* Image Modal */}
      <ImageModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Message Actions Modal */}
      {selectedMessage && (
        <MessageActions
          message={selectedMessage}
          visible={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onEdit={(editedText) => {
            // Handle message edit
            setSelectedMessage(null);
          }}
          onDelete={() => {
            // Handle message delete
            setSelectedMessage(null);
          }}
        />
      )}

      {/* Chatroom Actions */}
      <ChatroomActions
        chatroom={chatroom}
        onDelete={() => {
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoldTheme.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  messagesContent: {
    paddingVertical: 16,
  },
});