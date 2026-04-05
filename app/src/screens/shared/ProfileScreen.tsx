import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Surface, Button, Avatar, List, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { spacing, radius } from '@/theme';

const ROLE_EMOJI: Record<string, string> = {
  student: '🎓',
  faculty: '👩‍🏫',
  store_employee: '🧑‍🍳',
};

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  faculty: 'Faculty',
  store_employee: 'Store Owner',
};

const TRUST_TIER_INFO = {
  good: { emoji: '🌟', label: 'Good standing', color: '#146C34' },
  watch: { emoji: '⚠️', label: 'On watch', color: '#7D5700' },
  restricted: { emoji: '🚫', label: 'Restricted', color: '#BA1A1A' },
};

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const c = theme.colors;

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!user) return null;

  const tier = TRUST_TIER_INFO[user.trust_tier] ?? TRUST_TIER_INFO.good;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.hero, { backgroundColor: c.primaryContainer, paddingTop: insets.top + 24 }]}
        >
          <Avatar.Text
            size={80}
            label={user.name.slice(0, 2).toUpperCase()}
            style={{ backgroundColor: c.primary }}
            labelStyle={{ color: c.onPrimary, fontSize: 32, fontWeight: '700' }}
          />
          <Text variant="headlineSmall" style={{ color: c.onPrimaryContainer, fontWeight: '700', marginTop: spacing.md }}>
            {user.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer, opacity: 0.8 }}>
            {user.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: c.primary }]}>
            <Text style={{ color: c.onPrimary, fontWeight: '600' }}>
              {ROLE_EMOJI[user.role]} {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </Animated.View>

        <View style={{ padding: spacing.base }}>
          {/* Trust tier (students/faculty only) */}
          {user.role !== 'store_employee' && (
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
                <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.md }}>
                  Reliability Score
                </Text>
                <View style={styles.trustRow}>
                  <Text style={{ fontSize: 28 }}>{tier.emoji}</Text>
                  <View style={{ marginLeft: spacing.md }}>
                    <Text variant="titleSmall" style={{ color: tier.color, fontWeight: '700' }}>{tier.label}</Text>
                    <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>
                      {user.no_show_count} no-show{user.no_show_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </Surface>
            </Animated.View>
          )}

          {/* Account info */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginTop: spacing.md }}>
            <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
              <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.sm }}>
                Account Info
              </Text>
              {user.register_number && (
                <List.Item
                  title="Register Number"
                  description={user.register_number}
                  left={(props) => <List.Icon {...props} icon="card-account-details-outline" />}
                  titleStyle={{ color: c.onSurfaceVariant, fontSize: 13 }}
                  descriptionStyle={{ color: c.onSurface, fontWeight: '600' }}
                />
              )}
              <List.Item
                title="Email"
                description={user.email}
                left={(props) => <List.Icon {...props} icon="email-outline" />}
                titleStyle={{ color: c.onSurfaceVariant, fontSize: 13 }}
                descriptionStyle={{ color: c.onSurface, fontWeight: '600' }}
              />
              <List.Item
                title="Email Verified"
                description={user.is_email_verified ? 'Verified ✅' : 'Not verified'}
                left={(props) => <List.Icon {...props} icon={user.is_email_verified ? 'check-circle' : 'alert-circle'} />}
                titleStyle={{ color: c.onSurfaceVariant, fontSize: 13 }}
                descriptionStyle={{ color: user.is_email_verified ? c.primary : c.error, fontWeight: '600' }}
              />
            </Surface>
          </Animated.View>

          {/* Sign out */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginTop: spacing.md }}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
              style={[styles.signOutBtn, { borderColor: c.error }]}
              contentStyle={{ height: 52 }}
              labelStyle={{ color: c.error, fontWeight: '600' }}
              icon="logout"
            >
              Sign Out
            </Button>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  roleBadge: { flexDirection: 'row', borderRadius: radius.full, paddingHorizontal: spacing.base, paddingVertical: spacing.xs, marginTop: spacing.md },
  card: { borderRadius: radius.xl, padding: spacing.base },
  trustRow: { flexDirection: 'row', alignItems: 'center' },
  signOutBtn: { borderRadius: radius.lg },
});
