import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldTheme } from '../../../constants/GoldTheme';

interface FixedUnreadDividerProps {
  unreadCount: number;
}

export function FixedUnreadDivider({ unreadCount }: FixedUnreadDividerProps) {
  if (unreadCount <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dividerLine} />
      <LinearGradient
        colors={GoldTheme.gradients.goldButton}
        style={styles.badge}
      >
        <Text style={styles.badgeText}>
          {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
        </Text>
      </LinearGradient>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GoldTheme.gold.primary,
    opacity: 0.5,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: GoldTheme.gold.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: GoldTheme.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
