import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@/src/utils/logger';

// Configure notification handler to hide notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Hide notifications when app is active
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

class NotificationService {
  private pushToken: string | null = null;
  private isRegistered = false;

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      Logger.info('Initializing notification service...');

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
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types and utilities
export { Notifications };
export type { Notification, NotificationResponse } from 'expo-notifications';
