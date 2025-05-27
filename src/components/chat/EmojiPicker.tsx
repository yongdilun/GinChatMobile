import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';
import { GoldTheme } from '../../../constants/GoldTheme';

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const { width, height } = Dimensions.get('window');

export function EmojiPicker({ visible, onClose, onEmojiSelect }: EmojiPickerProps) {
  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Emoji</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={GoldTheme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Emoji Picker */}
          <View style={styles.pickerContainer}>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelect}
              showTabs={true}
              showSearchBar={true}
              showSectionTitles={true}
              category={undefined}
              columns={8}
              placeholder="Search emojis..."
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.6,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GoldTheme.text.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
