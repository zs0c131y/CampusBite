import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Text, Searchbar, useTheme, Surface, Chip, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, LinearTransition } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { storesApi } from '@/api/stores';
import { ordersApi } from '@/api/orders';
import { useAuth } from '@/contexts/AuthContext';
import type { Store, Order } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import { getGreeting, formatOperatingHours, isActiveOrder } from '@/utils';
import StoreCard from '@/components/StoreCard';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'Home'>;

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = getGreeting(user?.name);

  const fetchAll = useCallback(async () => {
    try {
      const [storesRes, ordersRes] = await Promise.allSettled([
        storesApi.list(),
        ordersApi.list({ status: 'placed,accepted,processing,ready' }),
      ]);
      if (storesRes.status === 'fulfilled' && storesRes.value.data.success) {
        const raw = storesRes.value.data.data;
        setStores(Array.isArray(raw) ? raw : (raw as any)?.stores ?? []);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
        setActiveOrders(ordersRes.value.data.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const c = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}
      >
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant }}>
              {greeting.emoji} {greeting.text}
            </Text>
            <Text variant="titleLarge" style={[styles.greetName, { color: c.onSurface }]}>
              What are you craving?
            </Text>
          </View>
        </View>
        <Searchbar
          placeholder="Search stores…"
          value={search}
          onChangeText={setSearch}
          style={[styles.searchbar, { backgroundColor: c.surfaceVariant }]}
          inputStyle={{ color: c.onSurface }}
          iconColor={c.onSurfaceVariant}
          elevation={0}
        />
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s._id}
        numColumns={1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 8 }}
        ListHeaderComponent={
          <>
            {/* Active order banner */}
            {activeOrders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
                <Pressable onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrders[0]._id })}>
                  <Surface style={[styles.activeBanner, { backgroundColor: c.primaryContainer }]} elevation={0}>
                    <Text style={{ fontSize: 20 }}>🍱</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelLarge" style={{ color: c.onPrimaryContainer, fontWeight: '700' }}>
                        {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}
                      </Text>
                      <Text variant="bodySmall" style={{ color: c.onPrimaryContainer, opacity: 0.8 }}>
                        Tap to track
                      </Text>
                    </View>
                    <Text style={{ color: c.primary, fontSize: 18 }}>→</Text>
                  </Surface>
                </Pressable>
              </Animated.View>
            )}

            {/* Restriction warning */}
            {user?.trust_tier === 'restricted' && (
              <Animated.View entering={FadeInDown.duration(250)} style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
                <Surface style={[styles.warnBanner, { backgroundColor: c.errorContainer }]} elevation={0}>
                  <Text style={{ fontSize: 18 }}>⛔</Text>
                  <Text variant="bodySmall" style={{ color: c.onErrorContainer, flex: 1, marginLeft: spacing.sm }}>
                    Ordering restricted due to no-shows. This will lift automatically.
                  </Text>
                </Surface>
              </Animated.View>
            )}

            {/* Section title */}
            <View style={[styles.sectionRow, { paddingHorizontal: spacing.base }]}>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>
                🏪 Campus Stores
              </Text>
              <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>
                {filtered.length} available
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: spacing.md }}>
                Loading stores…
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '600' }}>No stores found</Text>
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 4 }}>
                {search ? `Nothing matches "${search}"` : 'No food outlets available right now.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 60).springify()}
            layout={LinearTransition.springify()}
            style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}
          >
            <StoreCard
              store={item}
              onPress={() => navigation.navigate('StoreMenu', { storeId: item._id, storeName: item.name })}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  greetName: { fontWeight: '700', marginTop: 2 },
  searchbar: { borderRadius: radius.lg },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md },
  warnBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  loadingCenter: { alignItems: 'center', paddingTop: 80 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.base },
});
