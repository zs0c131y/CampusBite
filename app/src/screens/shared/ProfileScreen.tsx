import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, Button, Avatar, List, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { spacing, radius } from '@/theme';

const ROLE_ICON: Record<string, string> = {
  student:        'school',
  faculty:        'account-tie',
  store_employee: 'store',
};

const ROLE_LABELS: Record<string, string> = {
  student:        'Student',
  faculty:        'Faculty',
  store_employee: 'Store Owner',
};

const TRUST_TIER_INFO = {
  good:       { icon: 'shield-check',   label: 'Good standing', color: '#146C34', bg: '#DCFCE7' },
  watch:      { icon: 'alert',          label: 'On watch',       color: '#7D5700', bg: '#FEF3C7' },
  restricted: { icon: 'block-helper',   label: 'Restricted',     color: '#BA1A1A', bg: '#FFDAD6' },
};

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const c = theme.colors;

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    setLoggingOut(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  const tier = TRUST_TIER_INFO[user.trust_tier as keyof typeof TRUST_TIER_INFO] ?? TRUST_TIER_INFO.good;

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
            labelStyle={{ color: c.onPrimary, fontSize: 32, fontFamily: 'Inter_700Bold' }}
          />
          <Text style={[styles.heroName, { color: c.onPrimaryContainer }]}>
            {user.name}
          </Text>
          <Text style={{ color: c.onPrimaryContainer, opacity: 0.8, fontFamily: 'Inter_400Regular', fontSize: 14 }}>
            {user.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: c.primary }]}>
            <MaterialCommunityIcons name={ROLE_ICON[user.role] as any} size={14} color={c.onPrimary} />
            <Text style={{ color: c.onPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 5 }}>
              {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </Animated.View>

        <View style={{ padding: spacing.base }}>
          {/* Trust tier (students/faculty only) */}
          {user.role !== 'store_employee' && (
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
                <Text style={[styles.cardTitle, { color: c.onSurface }]}>Reliability Score</Text>
                <View style={[styles.trustRow, { backgroundColor: tier.bg, borderRadius: radius.lg, padding: spacing.md }]}>
                  <View style={[styles.tierIcon, { backgroundColor: tier.color + '20' }]}>
                    <MaterialCommunityIcons name={tier.icon as any} size={24} color={tier.color} />
                  </View>
                  <View style={{ marginLeft: spacing.md }}>
                    <Text style={{ color: tier.color, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
                      {tier.label}
                    </Text>
                    <Text style={{ color: tier.color, fontFamily: 'Inter_400Regular', fontSize: 12, opacity: 0.8, marginTop: 2 }}>
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
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Account Info</Text>
              {user.register_number && (
                <List.Item
                  title="Register Number"
                  description={user.register_number}
                  left={(props) => <List.Icon {...props} icon="card-account-details-outline" />}
                  titleStyle={{ color: c.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' }}
                  descriptionStyle={{ color: c.onSurface, fontFamily: 'Inter_600SemiBold' }}
                />
              )}
              <List.Item
                title="Email"
                description={user.email}
                left={(props) => <List.Icon {...props} icon="email-outline" />}
                titleStyle={{ color: c.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' }}
                descriptionStyle={{ color: c.onSurface, fontFamily: 'Inter_600SemiBold' }}
              />
              <List.Item
                title="Email Verified"
                description={user.is_email_verified ? 'Verified' : 'Not verified'}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={user.is_email_verified ? 'check-circle' : 'alert-circle'}
                    color={user.is_email_verified ? c.primary : c.error}
                  />
                )}
                titleStyle={{ color: c.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular' }}
                descriptionStyle={{ color: user.is_email_verified ? c.primary : c.error, fontFamily: 'Inter_600SemiBold' }}
              />
            </Surface>
          </Animated.View>

          {/* Sign out */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginTop: spacing.md }}>
            <Button
              mode="outlined"
              onPress={() => setShowLogoutDialog(true)}
              loading={loggingOut}
              disabled={loggingOut}
              style={[styles.signOutBtn, { borderColor: c.error }]}
              contentStyle={{ height: 52 }}
              labelStyle={{ color: c.error, fontFamily: 'Inter_600SemiBold' }}
              icon="logout"
            >
              Sign Out
            </Button>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Sign-out confirmation dialog (M3-styled) */}
      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => setShowLogoutDialog(false)}
          style={{ borderRadius: radius.xl, backgroundColor: c.surface }}
        >
          <Dialog.Icon icon="logout" size={40} />
          <Dialog.Title style={{ textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
            Sign Out?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              You'll need to log in again to place orders.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: spacing.base }}>
            <Button
              onPress={() => setShowLogoutDialog(false)}
              labelStyle={{ color: c.onSurfaceVariant, fontFamily: 'Inter_500Medium' }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              buttonColor={c.error}
              textColor={c.onError}
              style={{ borderRadius: radius.lg }}
              labelStyle={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  heroName: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: spacing.md },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  card: { borderRadius: radius.xl, padding: spacing.base },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: spacing.md },
  trustRow: { flexDirection: 'row', alignItems: 'center' },
  tierIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  signOutBtn: { borderRadius: radius.lg },
});
