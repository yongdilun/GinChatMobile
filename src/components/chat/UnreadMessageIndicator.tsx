import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GoldTheme } from '../../../constants/GoldTheme';

interface Message {
  id: string;
  sender_id: number;
  text_content?: string;
  sent_at: string;
  read_status?: Array<{
    user_id: number;
    username: string;
    is_read: boolean;
    read_at: string;
  }>;
}

interface UnreadMessageIndicatorProps {
  messages: Message[];
  currentUserId: number;
  onScrollToUnread: (messageIndex: number) => void;
  isVisible: boolean;
}

export function UnreadMessageIndicator({
  messages,
  currentUserId,
  onScrollToUnread,
  isVisible
}: UnreadMessageIndicatorProps) {
  // Find the oldest unread message (static calculation, not affected by real-time updates)
  const oldestUnreadInfo = useMemo(() => {
    // Don't show if no messages, not visible, or messages array is empty
    if (!messages || messages.length === 0 || !isVisible) return null;

    // Sort messages by sent_at (oldest first for this calculation)
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );

    // Find the first message that the current user hasn't read
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];

      // Skip own messages
      if (message.sender_id === currentUserId) continue;

      // Check if current user has read this message
      const userReadStatus = message.read_status?.find(
        status => status.user_id === currentUserId && status.is_read === true
      );

      if (!userReadStatus) {
        // Found the oldest unread message
        // Find its index in the original messages array (which is sorted newest first)
        const originalIndex = messages.findIndex(m => m.id === message.id);

        return {
          message,
          originalIndex,
          count: sortedMessages.slice(i).filter(m => {
            if (m.sender_id === currentUserId) return false;
            const readStatus = m.read_status?.find(
              status => status.user_id === currentUserId && status.is_read === true
            );
            return !readStatus;
          }).length
        };
      }
    }

    return null;
  }, [messages, currentUserId, isVisible]);

  // Don't show if no unread messages, not visible, or no messages at all
  if (!oldestUnreadInfo || !isVisible || !messages || messages.length === 0) {
    return null;
  }

  const handlePress = () => {
    onScrollToUnread(oldestUnreadInfo.originalIndex);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#FF6B6B', '#FF5252']}
          style={styles.indicator}
        >
          <View style={styles.content}>
            <Ionicons name="arrow-down" size={16} color="#fff" />
            <Text style={styles.text}>
              unread message
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  indicator: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
