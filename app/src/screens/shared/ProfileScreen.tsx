import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface, Button, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
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
  good:       { icon: 'shield-check',  label: 'Good Standing', color: '#146C34', bg: '#DCFCE7' },
  watch:      { icon: 'alert-circle',  label: 'On Watch',      color: '#7D5700', bg: '#FEF3C7' },
  restricted: { icon: 'block-helper',  label: 'Restricted',    color: '#BA1A1A', bg: '#FFDAD6' },
};

function InfoRow({ icon, label, value, valueColor }: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: c.primaryContainer }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={c.onPrimaryContainer} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: c.onSurfaceVariant }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor ?? c.onSurface }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
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
  const initials = user.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Animated.ScrollView
        entering={FadeIn.duration(220)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient hero ── */}
        <LinearGradient
          colors={[c.primary, '#7A3C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 24 }]}
        >
          {/* Avatar */}
          <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.35)' }]}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{user.name}</Text>

          {/* Role badge */}
          <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <MaterialCommunityIcons name={ROLE_ICON[user.role] as any} size={13} color="#fff" />
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[user.role]}</Text>
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => setShowEditDialog(true)}
            style={({ pressed }) => [styles.editBtn, { backgroundColor: 'rgba(255,255,255,0.15)', opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={14} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </LinearGradient>

        {/* ── Trust tier (non-store) ── */}
        {user.role !== 'store_employee' && (
          <View style={styles.tierRow}>
            <View style={[styles.tierCard, { backgroundColor: tier.bg }]}>
              <MaterialCommunityIcons name={tier.icon as any} size={20} color={tier.color} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                <Text style={[styles.tierSub, { color: tier.color }]}>
                  {user.no_show_count} no-show{user.no_show_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.body}>
          {/* ── Account details card ── */}
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-circle-outline" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Account Details</Text>
            </View>

            {user.register_number && (
              <InfoRow
                icon="card-account-details-outline"
                label="Register Number"
                value={user.register_number}
              />
            )}
            <InfoRow
              icon="email-outline"
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={user.is_email_verified ? 'check-circle' : 'alert-circle-outline'}
              label="Email Status"
              value={user.is_email_verified ? 'Verified' : 'Not verified'}
              valueColor={user.is_email_verified ? c.primary : c.error}
            />
            <InfoRow
              icon={ROLE_ICON[user.role] as string}
              label="Role"
              value={ROLE_LABELS[user.role] ?? user.role}
            />
          </Surface>

          {/* ── Sign out ── */}
          <Pressable
            onPress={() => setShowLogoutDialog(true)}
            style={({ pressed }) => [styles.signOutRow, { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: c.errorContainer }]}>
              <MaterialCommunityIcons name="logout" size={18} color={c.onErrorContainer} />
            </View>
            <Text style={[styles.signOutText, { color: c.error }]}>Sign Out</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.error} style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>
      </Animated.ScrollView>

      {/* ── Edit info dialog ── */}
      <Portal>
        <Dialog
          visible={showEditDialog}
          onDismiss={() => setShowEditDialog(false)}
          style={{ borderRadius: radius.xl, backgroundColor: c.surface }}
        >
          <Dialog.Icon icon="monitor-account" size={40} />
          <Dialog.Title style={{ textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
            Edit on Web
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 }}>
              Profile details can only be edited from the CampusBite web app. Visit the website and sign in to make changes.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center' }}>
            <Button
              mode="contained"
              onPress={() => setShowEditDialog(false)}
              style={{ borderRadius: radius.lg, minWidth: 100 }}
              labelStyle={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Got it
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ── Sign-out dialog ── */}
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
              loading={loggingOut}
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

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff',
  },
  heroName: {
    fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base, paddingVertical: 5,
  },
  roleBadgeText: {
    color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 13,
  },

  // Tier
  tierRow: {
    paddingHorizontal: spacing.base,
    marginTop: -spacing.lg,
    marginBottom: spacing.xs,
  },
  tierCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingHorizontal: spacing.base,
  },
  tierLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tierSub:   { fontSize: 12, fontFamily: 'Inter_400Regular', opacity: 0.8, marginTop: 1 },

  // Body
  body: { paddingHorizontal: spacing.base, gap: spacing.sm, marginTop: spacing.sm },

  // Card
  card: {
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, gap: spacing.md,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },

  // Edit button
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    marginTop: spacing.md,
  },
  editBtnText: {
    color: '#fff', fontFamily: 'Inter_500Medium', fontSize: 13,
  },

  // Sign out
  signOutRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
