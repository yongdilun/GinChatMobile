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
import { AudioRecorder } from './AudioRecorder';
import { SelectedMediaType } from '../../hooks/useMediaPicker';
import { AudioRecording } from '../../hooks/useAudioRecorder';
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
  // Audio recording props
  recordedAudio: AudioRecording | null;
  onStartRecording: () => void;
  onRemoveAudio: () => void;
  isRecorderVisible: boolean;
  onRecordingComplete: (uri: string, duration: number) => void;
  onRecordingCancel: () => void;
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
  isUploading,
  recordedAudio,
  onStartRecording,
  onRemoveAudio,
  isRecorderVisible,
  onRecordingComplete,
  onRecordingCancel,
}: MessageInputProps) {
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={messageInputStyles.inputContainer}
      >
        {/* Media Preview */}
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

        {/* Audio Recording Preview */}
        {recordedAudio && (
          <View style={messageInputStyles.mediaPreview}>
            <View style={messageInputStyles.mediaPreviewContent}>
              <View style={messageInputStyles.audioPreview}>
                <AudioPlayer uri={recordedAudio.uri} />
              </View>

              <TouchableOpacity onPress={onRemoveAudio} style={messageInputStyles.removeButton}>
                <Ionicons name="close-circle" size={24} color={GoldTheme.status.error} />
              </TouchableOpacity>
            </View>

            <View style={messageInputStyles.fileInfoContainer}>
              <Text style={messageInputStyles.fileName}>
                Voice Message ({Math.round(recordedAudio.duration)}s)
              </Text>
            </View>
          </View>
        )}

        <View style={messageInputStyles.messageInputRow}>
          {/* Attach Media Button */}
          <TouchableOpacity
            onPress={onPickMedia}
            style={[
              messageInputStyles.attachButton,
              (sending || pickingMedia || isUploading || !!selectedMedia || !!recordedAudio) && messageInputStyles.disabledButton
            ]}
            disabled={sending || pickingMedia || isUploading || !!selectedMedia || !!recordedAudio}
            activeOpacity={0.7}
          >
            {pickingMedia ? (
              <ActivityIndicator size="small" color={GoldTheme.gold.primary} />
            ) : (
              <Ionicons name="attach" size={24} color={GoldTheme.gold.primary} />
            )}
          </TouchableOpacity>

          {/* Microphone Button */}
          <TouchableOpacity
            onPress={onStartRecording}
            style={[
              messageInputStyles.micButton,
              (sending || pickingMedia || isUploading || !!selectedMedia || !!recordedAudio) && messageInputStyles.disabledButton
            ]}
            disabled={sending || pickingMedia || isUploading || !!selectedMedia || !!recordedAudio}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color={GoldTheme.gold.primary} />
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
              (messageText.trim() || selectedMedia || recordedAudio) && !sending && !isUploading
                ? messageInputStyles.sendButtonActive
                : messageInputStyles.sendButtonDisabled,
            ]}
            disabled={(!messageText.trim() && !selectedMedia && !recordedAudio) || sending || isUploading}
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

      {/* Audio Recorder Modal */}
      <AudioRecorder
        isVisible={isRecorderVisible}
        onRecordingComplete={onRecordingComplete}
        onCancel={onRecordingCancel}
      />
    </>
  );
}
