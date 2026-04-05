import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Surface, TextInput, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { storesApi } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { Store } from '@/api/types';
import { spacing, radius } from '@/theme';

export default function StoreSettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [saving, setSaving] = useState(false);
  const c = theme.colors;

  useEffect(() => {
    storesApi.list().then(({ data }) => {
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
    });
  }, [user]);

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
      Alert.alert('Saved ✅', 'Store settings updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>Store Settings ⚙️</Text>
      </View>

      <Animated.ScrollView entering={FadeIn.duration(220)} contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: c.onSurface }]}>🏪 Store Info</Text>
          <TextInput label="Store name" value={name} onChangeText={setName} mode="outlined" style={styles.input} outlineStyle={{ borderRadius: radius.md }} />
          <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={2} style={styles.input} outlineStyle={{ borderRadius: radius.md }} />
        </Surface>

        <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: c.onSurface }]}>💳 Payment</Text>
          <TextInput label="UPI ID (e.g. store@paytm)" value={upiId} onChangeText={setUpiId} mode="outlined" autoCapitalize="none" style={styles.input} outlineStyle={{ borderRadius: radius.md }} left={<TextInput.Icon icon="qrcode" />} />
        </Surface>

        <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: c.onSurface }]}>🕐 Operating Hours</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TextInput label="Opening time" value={openTime} onChangeText={setOpenTime} mode="outlined" placeholder="9:00 AM" style={[styles.input, { flex: 1 }]} outlineStyle={{ borderRadius: radius.md }} />
            <TextInput label="Closing time" value={closeTime} onChangeText={setCloseTime} mode="outlined" placeholder="6:00 PM" style={[styles.input, { flex: 1 }]} outlineStyle={{ borderRadius: radius.md }} />
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={[styles.saveBtn, { marginTop: spacing.xl }]}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
          icon="content-save"
        >
          Save Settings
        </Button>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  card: { borderRadius: radius.xl, padding: spacing.base },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.md },
  input: { marginBottom: spacing.sm },
  saveBtn: { borderRadius: radius.lg },
});
