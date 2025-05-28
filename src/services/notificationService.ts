import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/logger';

// Enhanced notification handler with app state awareness
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const appState = AppState.currentState;
    const isInForeground = appState === 'active';

    // Show notifications when app is in background/inactive, hide when active
    return {
      shouldShowAlert: !isInForeground,
      shouldPlaySound: !isInForeground,
      shouldSetBadge: true, // Always update badge
    };
  },
});

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

export interface NotificationData {
  type: 'new_message' | 'message_read' | 'user_joined' | 'user_left';
  chatroomId?: string;
  senderId?: number;
  messageId?: string;
  timestamp?: string;
}

export interface NotificationState {
  totalUnreadCount: number;
  chatroomUnreadCounts: Record<string, number>;
  lastNotificationTime: number;
  isInForeground: boolean;
}

export interface NotificationGroup {
  chatroomId: string;
  chatroomName: string;
  count: number;
  lastMessage: string;
  lastSender: string;
  timestamp: number;
}

class NotificationService {
  private pushToken: string | null = null;
  private isRegistered = false;
  private notificationState: NotificationState = {
    totalUnreadCount: 0,
    chatroomUnreadCounts: {},
    lastNotificationTime: 0,
    isInForeground: true,
  };
  private notificationGroups: Map<string, NotificationGroup> = new Map();
  private appStateSubscription: any = null;

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      Logger.info('Initializing notification service...');

      // Setup app state monitoring
      this.setupAppStateMonitoring();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Logger.warn('Notification permissions not granted');
        return;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        this.pushToken = token;
        await this.storePushToken(token);
        Logger.info('Push token obtained and stored');
      }

      // Load saved notification state
      await this.loadNotificationState();

      // Setup notification categories for actions
      await this.setupNotificationCategories();

      this.isRegistered = true;
      Logger.info('Notification service initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize notification service:', error);
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        Logger.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Logger.warn('Notification permission denied');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Chat Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      Logger.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        Logger.warn('Push tokens only work on physical devices');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'ed9112c0-dcb5-44d5-abf9-2f85fc7baf6c', // Your actual project ID
      });

      Logger.info('Push token obtained:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      Logger.error('Error getting push token:', error);
      return null;
    }
  }

  // Store push token locally
  async storePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('pushToken', token);
      Logger.debug('Push token stored locally');
    } catch (error) {
      Logger.error('Error storing push token:', error);
    }
  }

  // Get stored push token
  async getStoredPushToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('pushToken');
      return token;
    } catch (error) {
      Logger.error('Error getting stored push token:', error);
      return null;
    }
  }

  // Get current push token
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  // Check if service is registered
  isServiceRegistered(): boolean {
    return this.isRegistered;
  }

  // Handle notification received while app is running
  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  // Handle notification response (when user taps notification)
  addNotificationResponseReceivedListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      Logger.debug('All notifications cleared');
    } catch (error) {
      Logger.error('Error clearing notifications:', error);
    }
  }

  // Set notification badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      Logger.debug('Badge count set to:', count);
    } catch (error) {
      Logger.error('Error setting badge count:', error);
    }
  }

  // Schedule local notification (for testing)
  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      Logger.debug('Local notification scheduled');
    } catch (error) {
      Logger.error('Error scheduling local notification:', error);
    }
  }

  // Setup app state monitoring
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const wasInForeground = this.notificationState.isInForeground;
      this.notificationState.isInForeground = nextAppState === 'active';

      Logger.debug(`App state changed: ${nextAppState}, isInForeground: ${this.notificationState.isInForeground}`);

      // When app comes to foreground, clear notifications and update badge
      if (!wasInForeground && this.notificationState.isInForeground) {
        this.handleAppForeground();
      }
    });
  }

  // Handle app coming to foreground
  private async handleAppForeground(): Promise<void> {
    try {
      // Clear all notifications when app becomes active
      await this.clearAllNotifications();

      // Update badge count based on actual unread messages
      // This should be called from the chat service when unread counts are updated
      Logger.debug('App came to foreground, cleared notifications');
    } catch (error) {
      Logger.error('Error handling app foreground:', error);
    }
  }

  // Setup notification categories for quick actions
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('message', [
        {
          identifier: 'reply',
          buttonTitle: 'Reply',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'mark_read',
          buttonTitle: 'Mark as Read',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      Logger.debug('Notification categories set up');
    } catch (error) {
      Logger.error('Error setting up notification categories:', error);
    }
  }

  // Load notification state from storage
  private async loadNotificationState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem('notificationState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.notificationState = {
          ...this.notificationState,
          ...parsed,
          isInForeground: AppState.currentState === 'active', // Always use current app state
        };
        Logger.debug('Notification state loaded from storage');
      }
    } catch (error) {
      Logger.error('Error loading notification state:', error);
    }
  }

  // Save notification state to storage
  private async saveNotificationState(): Promise<void> {
    try {
      await AsyncStorage.setItem('notificationState', JSON.stringify(this.notificationState));
      Logger.debug('Notification state saved to storage');
    } catch (error) {
      Logger.error('Error saving notification state:', error);
    }
  }

  // Update unread count for a chatroom
  async updateChatroomUnreadCount(chatroomId: string, count: number): Promise<void> {
    this.notificationState.chatroomUnreadCounts[chatroomId] = count;
    this.notificationState.totalUnreadCount = Object.values(this.notificationState.chatroomUnreadCounts)
      .reduce((total, count) => total + count, 0);

    await this.setBadgeCount(this.notificationState.totalUnreadCount);
    await this.saveNotificationState();

    Logger.debug(`Updated unread count for chatroom ${chatroomId}: ${count}, total: ${this.notificationState.totalUnreadCount}`);
  }

  // Get current notification state
  getNotificationState(): NotificationState {
    return { ...this.notificationState };
  }

  // Handle incoming notification data
  async handleNotificationData(data: NotificationData): Promise<void> {
    try {
      switch (data.type) {
        case 'new_message':
          if (data.chatroomId) {
            await this.handleNewMessageNotification(data);
          }
          break;
        case 'message_read':
          if (data.chatroomId) {
            await this.handleMessageReadNotification(data);
          }
          break;
        default:
          Logger.debug('Unhandled notification type:', data.type);
      }
    } catch (error) {
      Logger.error('Error handling notification data:', error);
    }
  }

  // Handle new message notification
  private async handleNewMessageNotification(data: NotificationData): Promise<void> {
    if (!data.chatroomId) return;

    const currentCount = this.notificationState.chatroomUnreadCounts[data.chatroomId] || 0;
    await this.updateChatroomUnreadCount(data.chatroomId, currentCount + 1);
  }

  // Handle message read notification
  private async handleMessageReadNotification(data: NotificationData): Promise<void> {
    if (!data.chatroomId) return;

    // Reset unread count for this chatroom
    await this.updateChatroomUnreadCount(data.chatroomId, 0);
  }

  // Cleanup method
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types and utilities
export { Notifications };
export type { Notification, NotificationResponse } from 'expo-notifications';
