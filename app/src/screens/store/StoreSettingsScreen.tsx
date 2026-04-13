import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, useTheme, TextInput, ActivityIndicator, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { storesApi, resolveStores } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { Store } from '@/api/types';
import { formatOperatingHours } from '@/utils';
import { spacing, radius } from '@/theme';
import { ScreenBars } from '@/components/ScreenBars';

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
          const list = resolveStores(data.data as any);
          const my = list.find((s) => s.owner_id === user?._id);
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
      <View style={[styles.container, styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const hoursDisplay = store?.operating_hours ? formatOperatingHours(store.operating_hours) : null;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBars style="light" backgroundColor={c.primary as string} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Hero header ── */}
        <LinearGradient
          colors={[c.primary, '#7A3C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 24 }]}
        >
          <View style={[styles.heroAvatarRing, { borderColor: 'rgba(255,255,255,0.35)' }]}>
            <View style={[styles.heroAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name="storefront" size={28} color="#fff" />
            </View>
          </View>
          <Text style={styles.heroName}>{store?.name ?? 'Your Store'}</Text>
          <View style={[styles.heroBadge, { backgroundColor: store?.is_active ? 'rgba(46,125,50,0.85)' : 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.heroDot, { backgroundColor: store?.is_active ? '#A5D6A7' : 'rgba(255,255,255,0.6)' }]} />
            <Text style={styles.heroBadgeText}>{store?.is_active ? 'Open' : 'Closed'}</Text>
          </View>
          {hoursDisplay && (
            <Text style={styles.heroHours}>{hoursDisplay}</Text>
          )}
        </LinearGradient>

        {/* ── Owner info card ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: -spacing.lg }}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-circle-outline" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Owner</Text>
            </View>
            <View style={styles.ownerRow}>
              <View style={[styles.ownerAvatar, { backgroundColor: c.primaryContainer }]}>
                <Text style={[styles.ownerInitials, { color: c.onPrimaryContainer }]}>
                  {user?.name?.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ownerName, { color: c.onSurface }]}>{user?.name}</Text>
                <Text style={[styles.ownerEmail, { color: c.onSurfaceVariant }]}>{user?.email}</Text>
              </View>
              <View style={[styles.rolePill, { backgroundColor: c.primaryContainer }]}>
                <Text style={[styles.rolePillText, { color: c.onPrimaryContainer }]}>Store</Text>
              </View>
            </View>
          </Surface>
        </View>

        {/* ── Store info ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Store Info</Text>
            </View>
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
          </Surface>
        </View>

        {/* ── Payment ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Payment</Text>
            </View>
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
            <View style={[styles.hintRow, { backgroundColor: c.primaryContainer + '66' }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={c.onPrimaryContainer} />
              <Text style={[styles.hintText, { color: c.onPrimaryContainer }]}>
                Customers will send payment to this UPI ID
              </Text>
            </View>
          </Surface>
        </View>

        {/* ── Operating hours ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Operating Hours</Text>
            </View>
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
          </Surface>
        </View>

        {/* ── Save button ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: c.primary, opacity: pressed || saving ? 0.8 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={c.onPrimary} size={20} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color={c.onPrimary} />
                <Text style={[styles.saveBtnText, { color: c.onPrimary }]}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Sign out ── */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.md, marginBottom: spacing.md }}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: c.error, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="logout" size={18} color={c.error} />
            <Text style={[styles.logoutBtnText, { color: c.error }]}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  // Hero gradient
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  heroAvatarRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroAvatar: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: {
    fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff',
    marginBottom: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroDot: { width: 8, height: 8, borderRadius: 4 },
  heroBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  heroHours: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },

  // Owner section
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  ownerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  ownerInitials: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  ownerName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  ownerEmail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  rolePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  rolePillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Cards
  card: {
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Inputs
  input: { marginBottom: spacing.sm },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.xs,
  },
  hintText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, height: 52, borderRadius: radius.xl,
  },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, height: 48, borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  logoutBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});