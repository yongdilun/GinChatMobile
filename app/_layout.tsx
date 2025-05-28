import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { SimpleWebSocketProvider } from '@/contexts/SimpleWebSocketContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { setupProductionLogging, Logger } from '../src/utils/logger';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { notificationService, Notifications } from '../src/services/notificationService';

export default function RootLayout() {
  // Setup production logging and notifications on app start
  useEffect(() => {
    setupProductionLogging();

    // Setup notification handlers
    const notificationListener = notificationService.addNotificationReceivedListener(
      (notification) => {
        Logger.info('Notification received while app is running:', notification);
        // Notifications are hidden in-app due to shouldShowAlert: false
      }
    );

    const responseListener = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        Logger.info('Notification tapped:', response);

        // Handle notification tap - navigate to relevant chat
        const data = response.notification.request.content.data;
        if (data?.chatroomId) {
          router.push(`/chat/${data.chatroomId}`);
        } else {
          router.push('/(tabs)/chats');
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <AuthProvider>
        <SimpleWebSocketProvider>
          <ProtectedRoute>
            <Stack
              screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: 'white' }
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="signup"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              />
          </Stack>
          </ProtectedRoute>
          <StatusBar style="light" />
        </SimpleWebSocketProvider>
      </AuthProvider>
    </View>
    </ErrorBoundary>
  );
}
