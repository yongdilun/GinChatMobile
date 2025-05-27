import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { SimpleWebSocketProvider } from '@/contexts/SimpleWebSocketContext';
import { ProtectedRoute } from '../src/components/ProtectedRoute';

export default function RootLayout() {
  return (
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
  );
}
