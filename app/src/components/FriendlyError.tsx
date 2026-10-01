import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { spacing, radius } from '@/theme';

interface FriendlyErrorProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function FriendlyError({
  emoji = '😕',
  title,
  subtitle,
  actionLabel,
  onAction,
}: FriendlyErrorProps) {
  const { colors: c } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.emojiWrap, { backgroundColor: c.primaryContainer }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.title, { color: c.onSurface }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emojiWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emoji: { fontSize: 44 },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  btn: { borderRadius: radius.lg },
  btnContent: { height: 48, paddingHorizontal: spacing.lg },
});