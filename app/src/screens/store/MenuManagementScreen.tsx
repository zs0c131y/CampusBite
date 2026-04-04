import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, FAB, Switch, ActivityIndicator, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { storesApi, menuApi } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/api/types';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

function MenuItemRow({ item, onToggle, onDelete }: { item: MenuItem; onToggle: () => void; onDelete: () => void }) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <Surface style={[styles.itemCard, { backgroundColor: item.is_available ? c.surface : c.surfaceVariant }]} elevation={1}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: c.primaryContainer }]}>
          <Text style={{ fontSize: 28 }}>🍽️</Text>
        </View>
      )}

      <View style={{ flex: 1, marginHorizontal: spacing.md }}>
        <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '600' }} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category && (
          <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>{item.category}</Text>
        )}
        <Text variant="bodyMedium" style={{ color: c.primary, fontWeight: '700', marginTop: 2 }}>
          {formatCurrency(item.price)}
        </Text>
      </View>

      <View style={styles.actions}>
        <Switch value={item.is_available} onValueChange={onToggle} />
        <IconButton icon="delete-outline" iconColor={c.error} size={20} onPress={onDelete} />
      </View>
    </Surface>
  );
}

export default function MenuManagementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const c = theme.colors;

  const fetchMenu = useCallback(async () => {
    if (!storeId) {
      // Try to get store from orders or profile — fallback: fetch all stores, find own
      try {
        const { data } = await storesApi.list();
        if (data.success) {
          const myStore = (data.data as any[]).find((s) => s.owner_id === user?._id);
          if (myStore) setStoreId(myStore._id);
        }
      } finally { }
      return;
    }
    try {
      const { data } = await storesApi.menu(storeId);
      if (data.success) setMenu(data.data?.menu ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, user]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggle = async (item: MenuItem) => {
    await Haptics.selectionAsync();
    try {
      await menuApi.toggleAvailability(item._id);
      setMenu((prev) => prev.map((i) => i._id === item._id ? { ...i, is_available: !i.is_available } : i));
    } catch {
      Alert.alert('Error', 'Failed to update availability.');
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      `Delete "${item.name}"?`,
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await menuApi.delete(item._id);
              setMenu((prev) => prev.filter((i) => i._id !== item._id));
            } catch {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>Menu 🍴</Text>
        <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>{menu.length} items</Text>
      </View>

      <FlatList
        data={menu}
        keyExtractor={(i) => i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMenu(); }} colors={[c.primary]} />}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 80 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>🫙</Text>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '600', marginTop: spacing.base }}>No menu items</Text>
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 4 }}>Tap + to add your first item</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <MenuItemRow item={item} onToggle={() => handleToggle(item)} onDelete={() => handleDelete(item)} />
          </Animated.View>
        )}
      />

      <FAB
        icon="plus"
        label="Add Item"
        style={[styles.fab, { backgroundColor: c.primary, bottom: insets.bottom + 16 }]}
        color={c.onPrimary}
        onPress={() => Alert.alert('Coming soon', 'Add item form will be available here.')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  itemCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.md },
  itemImage: { width: 60, height: 60, borderRadius: radius.md },
  itemImagePlaceholder: { width: 60, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', right: spacing.base },
  center: { paddingTop: 60, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
});
