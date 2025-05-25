import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GoldTheme } from '../../constants/GoldTheme';
import { Chatroom } from '../services/api';

interface ChatroomActionsProps {
  chatroom: Chatroom;
  isVisible: boolean;
  onClose: () => void;
  onDelete: (chatroomId: string) => Promise<void>;
  currentUserId: number;
}

export function ChatroomActions({
  chatroom,
  isVisible,
  onClose,
  onDelete,
  currentUserId,
}: ChatroomActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show delete option for chatroom creator
  const canDelete = chatroom.created_by === currentUserId;

  const handleDelete = () => {
    Alert.alert(
      'Delete Chatroom',
      `Are you sure you want to delete "${chatroom.name}"?\n\nThis will permanently delete:\n• The entire chatroom\n• All messages and media\n• All member data\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDelete(chatroom.id);
              onClose();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete chatroom. Please try again.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleViewMembers = () => {
    Alert.alert(
      'Chatroom Members',
      `Members (${chatroom.members.length}):\n\n${chatroom.members
        .map((member, index) => `${index + 1}. ${member.username}`)
        .join('\n')}`,
      [{ text: 'OK' }]
    );
    onClose();
  };

  const handleCopyRoomCode = () => {
    // In a real app, you'd copy to clipboard
    Alert.alert(
      'Room Code',
      `Room Code: ${chatroom.room_code || 'N/A'}\n\nShare this code with others to let them join this chatroom.`,
      [{ text: 'OK' }]
    );
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionsContainer}>
          <LinearGradient
            colors={[GoldTheme.background.card, GoldTheme.background.secondary]}
            style={styles.actionsGradient}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{chatroom.name}</Text>
              <Text style={styles.headerSubtitle}>Chatroom Options</Text>
            </View>

            <View style={styles.actionSeparator} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleViewMembers}
            >
              <Ionicons name="people-outline" size={20} color={GoldTheme.gold.primary} />
              <Text style={styles.actionText}>
                View Members ({chatroom.members.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleCopyRoomCode}
            >
              <Ionicons name="copy-outline" size={20} color={GoldTheme.gold.primary} />
              <Text style={styles.actionText}>Room Code</Text>
            </TouchableOpacity>

            {canDelete && (
              <>
                <View style={styles.actionSeparator} />
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={GoldTheme.status.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color={GoldTheme.status.error} />
                  )}
                  <Text style={[styles.actionText, { color: GoldTheme.status.error }]}>
                    Delete Chatroom
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.actionSeparator} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={20} color={GoldTheme.text.muted} />
              <Text style={[styles.actionText, { color: GoldTheme.text.muted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    minWidth: 280,
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    margin: 20,
  },
  actionsGradient: {
    padding: 8,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: GoldTheme.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: GoldTheme.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionText: {
    color: GoldTheme.text.primary,
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  actionSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginHorizontal: 16,
  },
});
