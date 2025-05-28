import { Platform } from 'react-native';
import { Logger } from '../utils/logger';

class FirebaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        Logger.info('Firebase service already initialized');
        return;
      }

      // For now, Firebase is only used for web platform
      if (Platform.OS === 'web') {
        Logger.info('Firebase would be initialized for web platform');
        // TODO: Add web Firebase initialization when needed
      } else {
        Logger.info('Firebase not needed for mobile - using Expo push notifications');
      }

      this.initialized = true;
    } catch (error) {
      Logger.error('Failed to initialize Firebase service:', error);
      throw error;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        Logger.info('FCM tokens only available on web platform');
        return null;
      }

      // TODO: Implement web FCM token retrieval when needed
      Logger.info('Web FCM token not implemented yet');
      return null;
    } catch (error) {
      Logger.error('Error getting FCM token:', error);
      return null;
    }
  }

  // For mobile platforms, we rely on Expo push notifications
  isFirebaseAvailable(): boolean {
    return this.initialized && Platform.OS === 'web';
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService(); 