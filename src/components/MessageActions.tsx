import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GoldTheme } from '../../constants/GoldTheme';
import { GoldButton } from './GoldButton';
import { Message } from '../services/api';

interface MessageActionsProps {
  message: Message;
  isVisible: boolean;
  onClose: () => void;
  onEdit: (messageId: string, newText: string, newMediaUrl?: string, newMessageType?: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  currentUserId: number;
}

export function MessageActions({
  message,
  isVisible,
  onClose,
  onEdit,
  onDelete,
  currentUserId,
}: MessageActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(message.text_content || '');
  const [editMediaUrl, setEditMediaUrl] = useState(message.media_url || '');
  const [editMessageType, setEditMessageType] = useState(message.message_type || 'text');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show actions for user's own messages
  const canModify = message.sender_id === currentUserId;

  const handleEdit = () => {
    setShowEditModal(true);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await onDelete(message.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
    onClose();
  };

  const handleSaveEdit = async () => {
    // Check if there's any content (text or media)
    if (!editText.trim() && !editMediaUrl.trim()) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    try {
      setIsEditing(true);

      // Determine message type based on content
      let messageType = editMessageType;
      if (editText.trim() && editMediaUrl.trim()) {
        // Both text and media
        if (editMediaUrl.includes('video')) {
          messageType = 'text_and_video';
        } else if (editMediaUrl.includes('audio')) {
          messageType = 'text_and_audio';
        } else {
          messageType = 'text_and_picture';
        }
      } else if (editMediaUrl.trim()) {
        // Only media
        if (editMediaUrl.includes('video')) {
          messageType = 'video';
        } else if (editMediaUrl.includes('audio')) {
          messageType = 'audio';
        } else {
          messageType = 'picture';
        }
      } else {
        // Only text
        messageType = 'text';
      }

      await onEdit(message.id, editText.trim(), editMediaUrl.trim() || undefined, messageType);
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit message. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  if (!canModify) {
    return null;
  }

  return (
    <>
      {/* Actions Modal */}
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
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleEdit}
                disabled={isDeleting}
              >
                <Ionicons name="create-outline" size={20} color={GoldTheme.gold.primary} />
                <Text style={styles.actionText}>Edit Message</Text>
              </TouchableOpacity>

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
                  Delete Message
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editContainer}>
            <LinearGradient
              colors={[GoldTheme.background.card, GoldTheme.background.secondary]}
              style={styles.editGradient}
            >
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>Edit Message</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={GoldTheme.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.editInputContainer}>
                <Text style={styles.inputLabel}>Message Text</Text>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Enter your message..."
                  placeholderTextColor={GoldTheme.text.muted}
                  multiline
                  maxLength={1000}
                  autoFocus
                />
              </View>

              {/* Media URL Input */}
              <View style={styles.editInputContainer}>
                <Text style={styles.inputLabel}>Media URL (optional)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editMediaUrl}
                  onChangeText={setEditMediaUrl}
                  placeholder="Enter media URL..."
                  placeholderTextColor={GoldTheme.text.muted}
                  multiline={false}
                />
                {editMediaUrl ? (
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setEditMediaUrl('')}
                  >
                    <Ionicons name="close-circle" size={20} color={GoldTheme.status.error} />
                    <Text style={styles.removeMediaText}>Remove Media</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.editActions}>
                <GoldButton
                  title="Cancel"
                  onPress={() => setShowEditModal(false)}
                  variant="outline"
                  style={styles.editButton}
                  disabled={isEditing}
                />
                <GoldButton
                  title={isEditing ? 'Saving...' : 'Save'}
                  onPress={handleSaveEdit}
                  style={styles.editButton}
                  disabled={isEditing || !editText.trim()}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
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
    minWidth: 200,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionsGradient: {
    padding: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionText: {
    color: GoldTheme.text.primary,
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  actionSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginHorizontal: 16,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  editGradient: {
    padding: 20,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editTitle: {
    color: GoldTheme.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  editInputContainer: {
    marginBottom: 20,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: GoldTheme.text.primary,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flex: 1,
  },
  inputLabel: {
    color: GoldTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  removeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  removeMediaText: {
    color: GoldTheme.status.error,
    fontSize: 14,
    marginLeft: 4,
  },
});
