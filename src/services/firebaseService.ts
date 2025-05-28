import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { Platform } from 'react-native';
import { Logger } from '../utils/logger';
import Constants from 'expo-constants';
import { firebaseConfig } from '../config/firebase';

class FirebaseService {
  private initialized = false;
  private app: FirebaseApp | null = null;

  // Check if we're running in Expo Go
  private isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        Logger.info('Firebase already initialized');
        return;
      }

      // Initialize Firebase with config
      if (getApps().length === 0) {
        Logger.info('Initializing Firebase with JS SDK...');
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApp();
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
      if (!this.initialized || !this.app) {
        Logger.error('Firebase not initialized');
        return null;
      }

      // FCM is only supported on web and in certain environments
      if (Platform.OS !== 'web') {
        Logger.info('FCM tokens only available on web platform with Firebase JS SDK');
        return null;
      }

      // Check if messaging is supported
      const messagingSupported = await isSupported();
      if (!messagingSupported) {
        Logger.info('Firebase messaging not supported in this environment');
        return null;
      }

      const messaging = getMessaging(this.app);
      const token = await getToken(messaging, {
        vapidKey: process.env.FIREBASE_VAPID_KEY, // You'll need to add this to your .env
      });

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

  // For mobile platforms, we'll rely on Expo push notifications
  isFirebaseAvailable(): boolean {
    return this.initialized && Platform.OS === 'web';
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService(); 