import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chatroom, Message } from '@/services/api';
import { GoldTheme } from '../../../constants/GoldTheme';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { ImageModal } from './ImageModal';
import { chatHeaderStyles } from './styles/chatHeaderStyles';

interface ChatDetailHeaderProps {
  chatroom: Chatroom | null;
  messages: Message[];
  onThreeDotPress?: () => void;
}

export function ChatDetailHeader({
  chatroom,
  messages,
  onThreeDotPress
}: ChatDetailHeaderProps) {
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'images' | 'videos' | 'audio'>('members');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = messages.filter(m => m.message_type.includes('picture') && m.media_url);
  const videos = messages.filter(m => m.message_type.includes('video') && m.media_url);
  const audios = messages.filter(m => m.message_type.includes('audio') && m.media_url);

  if (!chatroom) {
    return null;
  }

  const members = chatroom.members || [];

  const getGoldGradient = (name: string) => {
    const colors = [
      ['#FFD700', '#FFA500'] as const,
      ['#DAA520', '#B8860B'] as const,
      ['#F4E4BC', '#D4AF37'] as const,
      ['#FFED4E', '#FFD700'] as const,
      ['#FFA500', '#FF8C00'] as const,
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const chatGradient = getGoldGradient(chatroom.name);

  return (
    <>
      <LinearGradient
        colors={[GoldTheme.background.primary, GoldTheme.background.secondary]}
        style={chatHeaderStyles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={chatHeaderStyles.headerContent}>
            <TouchableOpacity
              style={chatHeaderStyles.backButtonInHeader}
              onPress={() => {
                console.log('[Header] Back button pressed');
                router.back();
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']}
                style={chatHeaderStyles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={24} color={GoldTheme.gold.primary} />
              </LinearGradient>
            </TouchableOpacity>

            <LinearGradient
              colors={chatGradient}
              style={chatHeaderStyles.chatAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={chatHeaderStyles.chatAvatarText}>
                {chatroom.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={chatHeaderStyles.headerTextContainer}>
              <Text style={chatHeaderStyles.headerTitle}>{chatroom.name}</Text>
              <View style={chatHeaderStyles.headerInfo}>
                <View style={chatHeaderStyles.memberCountBadge}>
                  <Ionicons name="people" size={12} color={GoldTheme.gold.primary} style={{ marginRight: 4 }} />
                  <Text style={chatHeaderStyles.memberCountText}>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={chatHeaderStyles.headerButton}
                  onPress={() => {
                    console.log('[Header] Details button pressed, current showContent:', showContent);
                    setShowContent(!showContent);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={chatHeaderStyles.headerButtonText}>
                    {showContent ? 'Hide' : 'Details'}
                  </Text>
                  <Ionicons
                    name={showContent ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={GoldTheme.gold.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={chatHeaderStyles.headerButton}
                  onPress={() => {
                    console.log('[Chat] Three-dot menu pressed');
                    if (onThreeDotPress) {
                      onThreeDotPress();
                    } else {
                      Alert.alert('Info', 'Chatroom actions not available');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={GoldTheme.gold.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {showContent && (
        <View style={chatHeaderStyles.headerPanel}>
          <LinearGradient
            colors={[GoldTheme.background.card, GoldTheme.background.secondary]}
            style={chatHeaderStyles.headerPanelGradient}
          >
            <View style={chatHeaderStyles.tabRow}>
              <TouchableOpacity
                style={[chatHeaderStyles.tabButton, activeTab === 'members' && chatHeaderStyles.tabActive]}
                onPress={() => setActiveTab('members')}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={activeTab === 'members' ? GoldTheme.gold.primary : GoldTheme.text.muted}
                />
                <Text style={[chatHeaderStyles.tabText, activeTab === 'members' && chatHeaderStyles.tabTextActive]}>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chatHeaderStyles.tabButton, activeTab === 'images' && chatHeaderStyles.tabActive]}
                onPress={() => setActiveTab('images')}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={activeTab === 'images' ? GoldTheme.gold.primary : GoldTheme.text.muted}
                />
                <Text style={[chatHeaderStyles.tabText, activeTab === 'images' && chatHeaderStyles.tabTextActive]}>Images</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chatHeaderStyles.tabButton, activeTab === 'videos' && chatHeaderStyles.tabActive]}
                onPress={() => setActiveTab('videos')}
              >
                <Ionicons
                  name="videocam-outline"
                  size={18}
                  color={activeTab === 'videos' ? GoldTheme.gold.primary : GoldTheme.text.muted}
                />
                <Text style={[chatHeaderStyles.tabText, activeTab === 'videos' && chatHeaderStyles.tabTextActive]}>Videos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chatHeaderStyles.tabButton, activeTab === 'audio' && chatHeaderStyles.tabActive]}
                onPress={() => setActiveTab('audio')}
              >
                <Ionicons
                  name="mic-outline"
                  size={18}
                  color={activeTab === 'audio' ? GoldTheme.gold.primary : GoldTheme.text.muted}
                />
                <Text style={[chatHeaderStyles.tabText, activeTab === 'audio' && chatHeaderStyles.tabTextActive]}>Audio</Text>
              </TouchableOpacity>
            </View>

            <View style={chatHeaderStyles.tabContent}>
              {activeTab === 'members' && (
                <ScrollView style={chatHeaderStyles.membersContainer} showsVerticalScrollIndicator={false}>
                  {members.map((member, index) => (
                    <View key={index} style={chatHeaderStyles.memberItem}>
                      <LinearGradient
                        colors={getGoldGradient(member.username)}
                        style={chatHeaderStyles.memberAvatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={chatHeaderStyles.memberAvatarText}>
                          {member.username.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      <Text style={chatHeaderStyles.memberName}>{member.username}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              {activeTab === 'images' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={chatHeaderStyles.mediaScrollView}>
                  {images.length > 0 ? (
                    images.map((msg, index) => (
                      <TouchableOpacity key={index} onPress={() => setSelectedImage(msg.media_url!)}>
                        <Image source={{ uri: msg.media_url! }} style={chatHeaderStyles.mediaThumbnail} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={chatHeaderStyles.emptyTabText}>No images yet</Text>
                  )}
                </ScrollView>
              )}

              {activeTab === 'videos' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={chatHeaderStyles.mediaScrollView}>
                  {videos.length > 0 ? (
                    videos.map((msg, index) => (
                      <View key={index} style={chatHeaderStyles.mediaVideoWrap}>
                        <VideoPlayer uri={msg.media_url!} isCompact={true} />
                      </View>
                    ))
                  ) : (
                    <Text style={chatHeaderStyles.emptyTabText}>No videos yet</Text>
                  )}
                </ScrollView>
              )}

              {activeTab === 'audio' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={chatHeaderStyles.mediaScrollView}>
                  {audios.length > 0 ? (
                    audios.map((msg, index) => (
                      <View key={index} style={chatHeaderStyles.mediaAudioWrap}>
                        <AudioPlayer uri={msg.media_url!} isCompact={true} />
                      </View>
                    ))
                  ) : (
                    <Text style={chatHeaderStyles.emptyTabText}>No audio files yet</Text>
                  )}
                </ScrollView>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      <ImageModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}
