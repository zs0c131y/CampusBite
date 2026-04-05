import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import type { LandingScreenProps } from '@/navigation/types';
import { spacing, radius } from '@/theme';

const FEATURES = [
  { icon: '🏪', label: 'Browse Canteens', desc: 'Explore menus from all campus stores' },
  { icon: '⚡', label: 'Order Fast', desc: 'Place an order in under a minute' },
  { icon: '📡', label: 'Live Tracking', desc: 'Track your order in real time' },
];

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  return (
    <LinearGradient
      colors={[c.background, c.primaryContainer + '55', c.background]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <StatusBar style="dark" />
      <Animated.View
        entering={FadeIn.duration(220)}
        style={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: c.primaryContainer }]}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <Text style={[styles.appName, { color: c.primary }]}>CampusBite</Text>
          <Text style={[styles.tagline, { color: c.onSurfaceVariant }]}>
            Order food from your campus canteen
          </Text>
        </View>

        {/* Feature tiles */}
        <View style={styles.tiles}>
          {FEATURES.map((f) => (
            <Surface key={f.label} style={styles.tile} elevation={2}>
              <Text style={styles.tileIcon}>{f.icon}</Text>
              <View style={styles.tileText}>
                <Text style={[styles.tileTitle, { color: c.onSurface }]}>{f.label}</Text>
                <Text style={[styles.tileDesc, { color: c.onSurfaceVariant }]}>{f.desc}</Text>
              </View>
            </Surface>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.btn}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={styles.btn}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
          >
            Create Account
          </Button>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.base,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  tiles: { flexDirection: 'column', gap: spacing.sm },
  tile: {
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tileIcon: { fontSize: 28, width: 36, textAlign: 'center' },
  tileText: { flex: 1 },
  tileTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  tileDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  actions: { gap: spacing.sm },
  btn: { borderRadius: radius.lg },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
});
