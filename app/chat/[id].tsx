import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
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
import { UnreadMessageIndicator } from '../../src/components/chat/UnreadMessageIndicator';
import { UnreadMessageDivider } from '../../src/components/chat/UnreadMessageDivider';
import { useWebSocketHandler } from '../../src/hooks/useWebSocketHandler';
import { useMediaPicker } from '../../src/hooks/useMediaPicker';
import { useAudioRecorder } from '../../src/hooks/useAudioRecorder';

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
  const { user, token } = useAuth();
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
  const [showChatroomActions, setShowChatroomActions] = useState(false);
  const [showUnreadIndicator, setShowUnreadIndicator] = useState(true);

  // Ref to track if we've already marked messages as read for this session
  const hasMarkedAsReadRef = useRef(false);

  // Media picker hook
  const {
    selectedMedia,
    pickingMedia,
    handlePickMedia,
    handleRemoveMedia,
    setSelectedMedia,
  } = useMediaPicker();

  // Audio recorder hook
  const {
    isRecorderVisible,
    recordedAudio,
    showRecorder,
    hideRecorder,
    handleRecordingComplete,
    handleRecordingCancel,
    clearRecording,
  } = useAudioRecorder();

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
              username: user.email || 'User',
              read_at: new Date().toISOString(),
              is_read: true
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
          'Authorization': `Bearer ${token}`,
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
  }, [user?.id, user?.email, token]);

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
                username: user.email || 'User',
                read_at: new Date().toISOString(),
                is_read: true
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
          'Authorization': `Bearer ${token}`,
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
    if (!chatroomId || !token) return;

    try {
      setLoading(true);

      // Load chatroom details
      const chatroomResponse = await chatAPI.getConversationById(chatroomId);
      setChatroom(chatroomResponse.chatroom);
      console.log('[Chat] 📋 Loaded chatroom:', chatroomResponse.chatroom);

      // Load messages
      const messagesResponse = await chatAPI.getMessages(chatroomId);
      console.log('[Chat] 📨 Messages response:', messagesResponse);

      // Handle the case where messages might be null or in a different format
      const messagesList = messagesResponse?.messages || messagesResponse || [];
      const sortedMessages = Array.isArray(messagesList)
        ? messagesList.sort((a: Message, b: Message) =>
            new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          )
        : [];

      console.log('[Chat] 📨 Processed messages:', sortedMessages.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        text_content: m.text_content?.substring(0, 50),
        read_status: m.read_status
      })));

      setMessages(sortedMessages);

      // Calculate static unread info only on initial load (not affected by WebSocket updates)
      const unreadInfo = calculateUnreadInfo(sortedMessages);
      setStaticUnreadInfo(unreadInfo);
      console.log('[Chat] 📍 Static unread info calculated:', unreadInfo);

      // Note: Messages will be marked as read by the room entry useEffect
      // after a 1.5 second delay to ensure messages are loaded

    } catch (error) {
      console.error('[Chat] Error loading chatroom data:', error);
      Alert.alert('Error', 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when chatroomId changes
  useEffect(() => {
    // Reset the mark-as-read flag when entering a new chatroom
    hasMarkedAsReadRef.current = false;
    // Reset static unread info when entering new chatroom
    setStaticUnreadInfo(null);
    loadChatroomData();
  }, [chatroomId, token]);

  // Auto-mark messages as read when entering the chat room (not based on screen focus)
  useEffect(() => {
    if (!chatroomId || !token || !user?.id || hasMarkedAsReadRef.current) return;

    // Mark messages as read after a short delay when entering the room
    // This ensures messages are loaded first and only happens once per room entry
    const timeoutId = setTimeout(() => {
      hasMarkedAsReadRef.current = true;
      console.log('[Chat] 📝 User entered chat room, marking messages as read');
      markAllMessagesAsRead();
    }, 1500); // 1.5 second delay to ensure messages are loaded

    return () => {
      clearTimeout(timeoutId);
    };
  }, [chatroomId, user?.id, token, markAllMessagesAsRead]); // Triggers when entering a new room

  // Send message function
  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedMedia && !recordedAudio) || sending || isUploading) return;

    try {
      setSending(true);
      let mediaUrl: string | null = null;
      let messageType: MessageType = 'text';

      // Handle selected media (images, videos, etc.)
      if (selectedMedia) {
        setIsUploading(true);
        try {
          const uploadResult = await mediaAPI.uploadMedia({
            uri: selectedMedia.uri,
            type: selectedMedia.mimeType || 'image/jpeg',
            name: selectedMedia.name || 'media',
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

      // Handle recorded audio
      if (recordedAudio) {
        setIsUploading(true);
        try {
          const uploadResult = await mediaAPI.uploadMedia({
            uri: recordedAudio.uri,
            type: 'audio/m4a',
            name: recordedAudio.name,
          }, 'audio');
          mediaUrl = uploadResult.media_url;
          messageType = 'audio';
        } catch (uploadError) {
          console.error('Audio upload error:', uploadError);
          Alert.alert('Upload Failed', 'Could not upload audio. Please try again.');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Determine final message type
      if (messageText.trim() && mediaUrl) {
        if (recordedAudio) {
          messageType = 'text_and_audio';
        } else {
          messageType = `text_and_${selectedMedia?.backendType || 'picture'}` as MessageType;
        }
      } else if (mediaUrl) {
        if (recordedAudio) {
          messageType = 'audio';
        } else {
          messageType = selectedMedia?.backendType as MessageType || 'picture';
        }
      } else {
        messageType = 'text';
      }

      const messageData = {
        text_content: messageText.trim() || undefined,
        media_url: mediaUrl || undefined,
        message_type: messageType,
      };

      await chatAPI.sendMessage(chatroomId!, messageData);

      // Clear input
      setMessageText('');
      setSelectedMedia(null);
      clearRecording();

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

  // Static unread message info - only calculated on room entry, not affected by WebSocket updates
  const [staticUnreadInfo, setStaticUnreadInfo] = useState<{
    messageId: string;
    originalIndex: number;
    unreadCount: number;
  } | null>(null);

  // Calculate unread info only when initially loading messages (not on WebSocket updates)
  const calculateUnreadInfo = useCallback((messageList: Message[]) => {
    if (!messageList || messageList.length === 0 || !user?.id) return null;

    // Sort messages by sent_at (oldest first for this calculation)
    const sortedMessages = [...messageList].sort((a, b) =>
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );

    // Find the first message that the current user hasn't read
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];

      // Skip own messages
      if (message.sender_id === user.id) continue;

      // Check if current user has read this message
      const userReadStatus = message.read_status?.find(
        status => status.user_id === user.id && status.is_read === true
      );

      if (!userReadStatus) {
        // Found the oldest unread message
        // Find its index in the original messages array (which is sorted newest first)
        const originalIndex = messageList.findIndex(m => m.id === message.id);

        // Count total unread messages
        const unreadCount = sortedMessages.slice(i).filter(m => {
          if (m.sender_id === user.id) return false;
          const readStatus = m.read_status?.find(
            status => status.user_id === user.id && status.is_read === true
          );
          return !readStatus;
        }).length;

        return {
          messageId: message.id,
          originalIndex,
          unreadCount
        };
      }
    }

    return null;
  }, [user?.id]);

  // Memoize read status calculations to prevent unnecessary recalculations
  const readStatusCache = useMemo(() => {
    const cache = new Map();

    messages.forEach(message => {
      // Only calculate for own messages
      if (message.sender_id !== user?.id) {
        cache.set(message.id, { icon: '', color: 'transparent', title: '' });
        return;
      }

      if (!message.read_status || message.read_status.length === 0) {
        cache.set(message.id, { icon: 'checkmark', color: '#888', title: 'Sent' });
        return;
      }

      const totalMembers = chatroom?.members?.length || 0;
      const readStatuses = message.read_status;
      const readCount = readStatuses.filter(status => status.is_read === true).length;

      // All members (except sender) have read the message
      if (readCount >= totalMembers - 1) { // -1 because sender doesn't count
        cache.set(message.id, {
          icon: 'checkmark-done',
          color: '#007AFF',
          title: 'Read by all'
        });
      } else {
        cache.set(message.id, {
          icon: 'checkmark-done',
          color: '#888',
          title: `Read by ${readCount} of ${totalMembers - 1}`
        });
      }
    });

    return cache;
  }, [messages, user?.id, chatroom?.members]);

  // Create combined data structure with messages and unread divider
  const messagesWithDivider = useMemo(() => {
    if (!staticUnreadInfo) {
      // No unread messages, return original messages with proper structure
      return messages.map((msg, index) => ({
        type: 'message',
        data: msg,
        id: msg.id || `message_${index}` // Ensure every item has an ID
      }));
    }

    const result = [];
    let dividerInserted = false;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      // Add the message first
      result.push({
        type: 'message',
        data: message,
        id: message.id || `message_${i}` // Ensure every message has an ID
      });

      // Insert divider AFTER the oldest unread message in array (appears ABOVE on inverted FlatList)
      if (!dividerInserted && message.id === staticUnreadInfo.messageId) {
        result.push({
          type: 'unread_divider',
          data: { unreadCount: staticUnreadInfo.unreadCount },
          id: `unread_divider_${message.id || i}` // Ensure unique ID
        });
        dividerInserted = true;
      }
    }

    return result;
  }, [messages, staticUnreadInfo]);

  // Get read status for messages (now uses cache)
  const getReadStatus = useCallback((message: Message) => {
    return readStatusCache.get(message.id) || { icon: '', color: 'transparent', title: '' };
  }, [readStatusCache]);

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
    setShowChatroomActions(true);
  };

  // Handle scroll to unread message
  const handleScrollToUnread = (messageIndex: number) => {
    if (flatListRef.current && messageIndex >= 0) {
      flatListRef.current.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5, // Center the message
      });
      // Hide the indicator after scrolling
      setShowUnreadIndicator(false);
    }
  };

  // Render message item or unread divider
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'unread_divider') {
      return <UnreadMessageDivider unreadCount={item.data.unreadCount} />;
    }

    // Regular message item
    const message = item.data as Message;
    const isOwnMessage = message.sender_id === user?.id;
    const userGradient = isOwnMessage ? null : getUserGradient(message.sender_name);

    return (
      <MessageItem
        item={message}
        isOwnMessage={isOwnMessage}
        userGradient={userGradient}
        onImageClick={handleImageClick}
        onLongPress={handleMessageLongPress}
        getReadStatus={getReadStatus}
      />
    );
  }, [user?.id, getUserGradient, handleImageClick, handleMessageLongPress, getReadStatus]);

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
          data={messagesWithDivider}
          renderItem={renderItem}
          keyExtractor={(item, index) => {
            // Use stable key - include item ID (either message ID or divider ID)
            return item.id || `item_${index}`;
          }}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          inverted
          onEndReachedThreshold={0.1}
          onScrollToIndexFailed={(info) => {
            // Handle scroll index failed
            console.warn('Scroll to index failed:', info);
          }}
        />

        {/* Unread Message Indicator */}
        {user && (
          <UnreadMessageIndicator
            messages={messages}
            currentUserId={user.id}
            onScrollToUnread={handleScrollToUnread}
            isVisible={showUnreadIndicator}
          />
        )}
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
        recordedAudio={recordedAudio}
        onStartRecording={showRecorder}
        onRemoveAudio={clearRecording}
        isRecorderVisible={isRecorderVisible}
        onRecordingComplete={handleRecordingComplete}
        onRecordingCancel={handleRecordingCancel}
      />

      {/* Image Modal */}
      <ImageModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Message Actions Modal */}
      {selectedMessage && user && (
        <MessageActions
          message={selectedMessage}
          isVisible={!!selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onEdit={async (messageId: string, newText: string, newMediaUrl?: string, newMessageType?: string) => {
            // Handle message edit
            try {
              console.log('[Chat] Editing message:', messageId, newText, newMediaUrl, newMessageType);

              const updateData = {
                text_content: newText || undefined,
                media_url: newMediaUrl || undefined,
                message_type: newMessageType || 'text',
              };

              await chatAPI.updateMessage(chatroomId!, messageId, updateData);

              // Update local state optimistically
              setMessages(prevMessages =>
                prevMessages.map(msg =>
                  msg.id === messageId
                    ? {
                        ...msg,
                        text_content: newText,
                        media_url: newMediaUrl,
                        message_type: newMessageType as any,
                        edited: true,
                      }
                    : msg
                )
              );

              console.log('[Chat] ✅ Message edited successfully');
              setSelectedMessage(null);
            } catch (error) {
              console.error('[Chat] ❌ Failed to edit message:', error);
              Alert.alert('Error', 'Failed to edit message. Please try again.');
            }
          }}
          onDelete={async (messageId: string) => {
            // Handle message delete
            try {
              console.log('[Chat] Deleting message:', messageId);

              await chatAPI.deleteMessage(chatroomId!, messageId);

              // Remove from local state optimistically
              setMessages(prevMessages =>
                prevMessages.filter(msg => msg.id !== messageId)
              );

              console.log('[Chat] ✅ Message deleted successfully');
              setSelectedMessage(null);
            } catch (error) {
              console.error('[Chat] ❌ Failed to delete message:', error);
              Alert.alert('Error', 'Failed to delete message. Please try again.');
            }
          }}
          currentUserId={user.id}
        />
      )}

      {/* Chatroom Actions */}
      {chatroom && user && (
        <ChatroomActions
          chatroom={chatroom}
          isVisible={showChatroomActions}
          onClose={() => setShowChatroomActions(false)}
          onDelete={async (chatroomId: string) => {
            try {
              // TODO: Implement chatroom delete API call
              console.log('Delete chatroom:', chatroomId);
              setShowChatroomActions(false);
              router.back();
            } catch (error) {
              console.error('Failed to delete chatroom:', error);
            }
          }}
          currentUserId={user.id}
        />
      )}
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