import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GoldTheme } from '../../../constants/GoldTheme';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { SelectedMediaType } from '../../hooks/useMediaPicker';
import { messageInputStyles } from './styles/messageInputStyles';

interface MessageInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  selectedMedia: SelectedMediaType | null;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onSendMessage: () => void;
  sending: boolean;
  pickingMedia: boolean;
  isUploading: boolean;
}

export function MessageInput({
  messageText,
  setMessageText,
  selectedMedia,
  onPickMedia,
  onRemoveMedia,
  onSendMessage,
  sending,
  pickingMedia,
  isUploading
}: MessageInputProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={messageInputStyles.inputContainer}
    >
      {selectedMedia && (
        <View style={messageInputStyles.mediaPreview}>
          <View style={messageInputStyles.mediaPreviewContent}>
            {selectedMedia.type === 'image' && (
              <Image source={{ uri: selectedMedia.uri }} style={messageInputStyles.previewImage} />
            )}
            {selectedMedia.type === 'video' && (
              <View style={messageInputStyles.videoPreview}>
                <VideoPlayer uri={selectedMedia.uri} />
              </View>
            )}
            {selectedMedia.type === 'audio' && (
              <View style={messageInputStyles.audioPreview}>
                <AudioPlayer uri={selectedMedia.uri} />
              </View>
            )}

            <TouchableOpacity onPress={onRemoveMedia} style={messageInputStyles.removeButton}>
              <Ionicons name="close-circle" size={24} color={GoldTheme.status.error} />
            </TouchableOpacity>
          </View>

          {selectedMedia.name && (
            <View style={messageInputStyles.fileInfoContainer}>
              <Text style={messageInputStyles.fileName}>
                {selectedMedia.name}
                {selectedMedia.size ? ` (${selectedMedia.size} KB)` : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={messageInputStyles.messageInputRow}>
        <TouchableOpacity
          onPress={onPickMedia}
          style={[
            messageInputStyles.attachButton,
            (sending || pickingMedia || isUploading || !!selectedMedia) && messageInputStyles.disabledButton
          ]}
          disabled={sending || pickingMedia || isUploading || !!selectedMedia}
          activeOpacity={0.7}
        >
          {pickingMedia ? (
            <ActivityIndicator size="small" color={GoldTheme.gold.primary} />
          ) : (
            <Ionicons name="attach" size={24} color={GoldTheme.gold.primary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={[
            messageInputStyles.textInput,
            (sending || isUploading) && messageInputStyles.disabledInput
          ]}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor={GoldTheme.text.secondary}
          multiline
          maxLength={1000}
          editable={!sending && !isUploading}
        />

        <TouchableOpacity
          onPress={onSendMessage}
          style={[
            messageInputStyles.sendButton,
            (messageText.trim() || selectedMedia) && !sending && !isUploading
              ? messageInputStyles.sendButtonActive
              : messageInputStyles.sendButtonDisabled,
          ]}
          disabled={(!messageText.trim() && !selectedMedia) || sending || isUploading}
        >
          <LinearGradient
            colors={GoldTheme.gradients.goldButton}
            style={messageInputStyles.sendButtonGradient}
          >
            {isUploading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="small" color={GoldTheme.text.inverse} />
                <Text style={messageInputStyles.uploadingText}>Uploading</Text>
              </View>
            ) : sending ? (
              <ActivityIndicator size="small" color={GoldTheme.text.inverse} />
            ) : (
              <Ionicons name="send" size={22} color={GoldTheme.text.inverse} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
