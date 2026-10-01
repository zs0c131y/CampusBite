import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { Text, useTheme, Surface, Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/api/users';
import { spacing, radius } from '@/theme';
import { ScreenBars } from '@/components/ScreenBars';
import { withOpacity } from '@/utils';

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
  const { user, logout, refreshUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const c = theme.colors;

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await usersApi.update({ phone_number: editPhone });
      await refreshUser();
      setEditingPhone(false);
      setSnackMsg('Phone number updated');
    } catch {
      setSnackMsg('Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

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
      <ScreenBars style="light" backgroundColor={c.primary as string} />
      <Animated.ScrollView
        entering={FadeIn.duration(220)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient hero ── */}
        <LinearGradient
          colors={[c.primary, c.secondary as string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 24 }]}
        >
          {/* Avatar */}
          <View style={[styles.avatarRing, { borderColor: withOpacity('#FFFFFF', 0.35) }]}>
            <View style={[styles.avatarCircle, { backgroundColor: withOpacity('#FFFFFF', 0.2) }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{user.name}</Text>

          {/* Role badge */}
          <View style={[styles.roleBadge, { backgroundColor: withOpacity('#FFFFFF', 0.2) }]}>
            <MaterialCommunityIcons name={ROLE_ICON[user.role] as any} size={13} color="#fff" />
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[user.role]}</Text>
          </View>
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

            {/* ── Phone row (editable) ── */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: c.primaryContainer }]}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={c.onPrimaryContainer} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: c.onSurfaceVariant }]}>Phone</Text>
                {editingPhone ? (
                  <View style={styles.phoneEditRow}>
                    <TextInput
                      value={editPhone}
                      onChangeText={setEditPhone}
                      style={[styles.phoneInput, { color: c.onSurface, borderColor: c.outline }]}
                      keyboardType="phone-pad"
                      autoFocus
                    />
                    <Pressable
                      onPress={handleSavePhone}
                      disabled={saving}
                      style={({ pressed }) => [
                        styles.phoneActionBtn,
                        { backgroundColor: c.primary, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={saving ? 'loading' : 'check'}
                        size={16}
                        color="#fff"
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingPhone(false)}
                      style={({ pressed }) => [
                        styles.phoneActionBtn,
                        { backgroundColor: c.surfaceVariant, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <MaterialCommunityIcons name="close" size={16} color={c.onSurface as string} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.phoneEditRow}>
                    <Text style={[styles.infoValue, { color: c.onSurface }]}>
                      {user.phone_number || 'Not set'}
                    </Text>
                    <Pressable
                      onPress={() => { setEditPhone(user.phone_number ?? ''); setEditingPhone(true); }}
                      style={({ pressed }) => [styles.pencilBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color={c.primary as string} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

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

      <Snackbar
        visible={snackMsg !== null}
        onDismiss={() => setSnackMsg(null)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  body: { paddingHorizontal: spacing.base, gap: spacing.sm, marginTop: spacing.sm },

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

  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  phoneActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilBtn: {
    padding: 4,
  },

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