import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Alert,
} from 'react-native';
import { Text, useTheme, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { storesApi } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { Store } from '@/api/types';
import { formatOperatingHours } from '@/utils';
import { spacing, radius } from '@/theme';

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  const { colors: c } = useTheme();
  return (
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.iconWrap, { backgroundColor: c.primaryContainer }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={c.onPrimaryContainer} />
      </View>
      <Text style={[sectionStyles.title, { color: c.onSurface }]}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  iconWrap: {
    width: 30, height: 30, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});

function SaveButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.saveBtn,
        { backgroundColor: c.primary, opacity: pressed || loading ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.onPrimary} size={20} />
      ) : (
        <>
          <MaterialCommunityIcons name="content-save-outline" size={18} color={c.onPrimary} />
          <Text style={[styles.saveBtnText, { color: c.onPrimary }]}>Save Changes</Text>
        </>
      )}
    </Pressable>
  );
}

export default function StoreSettingsScreen() {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');

  useEffect(() => {
    storesApi.list()
      .then(({ data }) => {
        if (data.success) {
          const my = (data.data as any[]).find((s) => s.owner_id === user?._id);
          if (my) {
            setStore(my);
            setName(my.name ?? '');
            setDescription(my.description ?? '');
            setUpiId(my.upi_id ?? '');
            if (my.operating_hours && typeof my.operating_hours === 'object') {
              setOpenTime(my.operating_hours.open ?? my.operating_hours.opening_time ?? '');
              setCloseTime(my.operating_hours.close ?? my.operating_hours.closing_time ?? '');
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user?._id]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('upi_id', upiId);
      if (openTime || closeTime) {
        formData.append('operating_hours', JSON.stringify({ open: openTime, close: closeTime }));
      }
      await storesApi.update(store._id, formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Store settings updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingCenter, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const hoursDisplay = store?.operating_hours ? formatOperatingHours(store.operating_hours) : null;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: c.elevation.level2 }]}>
        <Text style={[styles.headerTitle, { color: c.onSurface }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Store profile card ──────────────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: c.elevation.level2, borderColor: c.outlineVariant }]}>
          <View style={[styles.storeAvatar, { backgroundColor: c.primaryContainer }]}>
            <MaterialCommunityIcons name="storefront-outline" size={28} color={c.onPrimaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: c.onSurface }]} numberOfLines={1}>
              {store?.name ?? 'Your Store'}
            </Text>
            {hoursDisplay ? (
              <Text style={[styles.profileMeta, { color: c.onSurfaceVariant }]}>{hoursDisplay}</Text>
            ) : null}
            <Text style={[styles.profileOwner, { color: c.onSurfaceVariant }]}>{user?.name}</Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: store?.is_active ? '#E8F5E9' : c.surfaceVariant }]}>
            <View style={[styles.activeDot, { backgroundColor: store?.is_active ? '#2E7D32' : c.outline }]} />
            <Text style={[styles.activeText, { color: store?.is_active ? '#2E7D32' : c.onSurfaceVariant }]}>
              {store?.is_active ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* ── Store Info ──────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
          <SectionHeader icon="storefront-outline" title="Store Info" />
          <TextInput
            label="Store name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineStyle={{ borderRadius: radius.md }}
            left={<TextInput.Icon icon="text-short" />}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            outlineStyle={{ borderRadius: radius.md }}
            left={<TextInput.Icon icon="text-long" />}
          />
        </View>

        {/* ── Payment ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
          <SectionHeader icon="qrcode-scan" title="Payment" />
          <TextInput
            label="UPI ID"
            value={upiId}
            onChangeText={setUpiId}
            mode="outlined"
            autoCapitalize="none"
            placeholder="yourstore@paytm"
            style={styles.input}
            outlineStyle={{ borderRadius: radius.md }}
            left={<TextInput.Icon icon="bank-outline" />}
          />
          <View style={[styles.infoRow, { backgroundColor: c.primaryContainer + '66' }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={c.onPrimaryContainer} />
            <Text style={[styles.infoText, { color: c.onPrimaryContainer }]}>
              Customers will send payment to this UPI ID
            </Text>
          </View>
        </View>

        {/* ── Operating Hours ──────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
          <SectionHeader icon="clock-outline" title="Operating Hours" />
          <View style={styles.hoursRow}>
            <TextInput
              label="Opens"
              value={openTime}
              onChangeText={setOpenTime}
              mode="outlined"
              placeholder="9:00 AM"
              style={[styles.input, { flex: 1 }]}
              outlineStyle={{ borderRadius: radius.md }}
              left={<TextInput.Icon icon="weather-sunset-up" />}
            />
            <MaterialCommunityIcons name="arrow-right" size={16} color={c.onSurfaceVariant} style={{ marginTop: spacing.sm }} />
            <TextInput
              label="Closes"
              value={closeTime}
              onChangeText={setCloseTime}
              mode="outlined"
              placeholder="6:00 PM"
              style={[styles.input, { flex: 1 }]}
              outlineStyle={{ borderRadius: radius.md }}
              left={<TextInput.Icon icon="weather-sunset-down" />}
            />
          </View>
        </View>

        {/* ── Account ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
          <SectionHeader icon="account-outline" title="Account" />
          <View style={styles.accountRow}>
            <View style={[styles.accountIcon, { backgroundColor: c.surfaceVariant }]}>
              <MaterialCommunityIcons name="account-circle-outline" size={20} color={c.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: c.onSurface }]}>{user?.name}</Text>
              <Text style={[styles.accountEmail, { color: c.onSurfaceVariant }]}>{user?.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: c.primaryContainer }]}>
              <Text style={[styles.roleText, { color: c.onPrimaryContainer }]}>Store</Text>
            </View>
          </View>
        </View>

        <SaveButton onPress={handleSave} loading={saving} />

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, { borderColor: c.error, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="logout" size={18} color={c.error} />
          <Text style={[styles.logoutText, { color: c.error }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  storeAvatar: {
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  profileName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  profileMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  profileOwner: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Cards
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  input: { marginBottom: spacing.sm },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.xs,
  },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },

  // Account row
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accountIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  accountName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  accountEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, height: 52, borderRadius: radius.xl, marginBottom: spacing.md,
  },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, height: 48, borderRadius: radius.xl,
    borderWidth: 1.5, marginBottom: spacing.md,
  },
  logoutText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
