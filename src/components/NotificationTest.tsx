import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';
import { GoldTheme } from '../../constants/GoldTheme';
import { Logger } from '../utils/logger';

export function NotificationTest() {
  const testLocalNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from GinChat!',
        { test: true }
      );
      Alert.alert('Success', 'Test notification scheduled!');
    } catch (error) {
      Logger.error('Failed to schedule test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  const checkNotificationStatus = async () => {
    const isRegistered = notificationService.isServiceRegistered();
    const pushToken = notificationService.getCurrentPushToken();
    
    Alert.alert(
      'Notification Status',
      `Service Registered: ${isRegistered}\nPush Token: ${pushToken ? 'Available' : 'Not available'}\n\nToken: ${pushToken?.substring(0, 50)}...`
    );
  };

  const clearNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      Logger.error('Failed to clear notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[GoldTheme.background.card, 'rgba(42, 42, 42, 0.95)']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Ionicons name="notifications" size={24} color={GoldTheme.gold.primary} />
          <Text style={styles.title}>Notification Test</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
          <LinearGradient
            colors={GoldTheme.gradients.goldShimmer}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="send" size={16} color={GoldTheme.background.primary} />
            <Text style={styles.buttonText}>Test Local Notification</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkNotificationStatus}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="information-circle" size={16} color="white" />
            <Text style={[styles.buttonText, { color: 'white' }]}>Check Status</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={clearNotifications}>
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="trash" size={16} color="white" />
            <Text style={[styles.buttonText, { color: 'white' }]}>Clear All</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: Notifications are hidden when app is active (shouldShowAlert: false).
          They will appear when app is in background or killed.
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GoldTheme.text.primary,
    marginLeft: 8,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GoldTheme.background.primary,
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    color: GoldTheme.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
});
