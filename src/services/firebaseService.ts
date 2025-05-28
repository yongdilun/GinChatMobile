import app from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { Logger } from '../utils/logger';
import Constants from 'expo-constants';

class FirebaseService {
  private initialized = false;

  // Check if we're running in Expo Go (which doesn't support React Native Firebase)
  private isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        Logger.info('Firebase already initialized');
        return;
      }

      // Skip Firebase initialization in Expo Go
      if (this.isExpoGo()) {
        Logger.info('Skipping Firebase initialization in Expo Go environment');
        return;
      }

      // Skip Firebase initialization in development
      if (__DEV__) {
        Logger.info('Skipping Firebase initialization in development environment');
        return;
      }

      // Initialize Firebase if not already initialized
      if (app.apps.length === 0) {
        Logger.info('Initializing Firebase...');
        // Firebase will auto-initialize using google-services.json on Android
        // @ts-ignore - React Native Firebase will auto-initialize from google-services.json
        app.initializeApp();
      }

      this.initialized = true;
      Logger.info('Firebase initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      if (!this.initialized) {
        Logger.error('Firebase not initialized');
        return null;
      }

      if (Platform.OS === 'android') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Logger.error('FCM permissions not granted');
          return null;
        }
      }

      const token = await messaging().getToken();
      if (token) {
        Logger.info('FCM token obtained');
        return token;
      } else {
        Logger.error('Failed to get FCM token');
        return null;
      }
    } catch (error) {
      Logger.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Setup message handlers
  setupMessageHandlers(): void {
    try {
      if (this.isExpoGo()) {
        Logger.info('Skipping FCM message handlers in Expo Go');
        return;
      }

      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        Logger.info('Message handled in the background!', remoteMessage);
      });

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        Logger.info('Message received in foreground!', remoteMessage);
      });

      // Handle notification opened app
      messaging().onNotificationOpenedApp((remoteMessage) => {
        Logger.info('Notification caused app to open from background state:', remoteMessage);
      });

      // Check whether an initial notification is available
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            Logger.info('Notification caused app to open from quit state:', remoteMessage);
          }
        });
    } catch (error) {
      Logger.error('Error setting up FCM message handlers:', error);
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService(); 