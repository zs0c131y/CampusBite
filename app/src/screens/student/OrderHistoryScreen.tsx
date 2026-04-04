import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ordersApi } from '@/api/orders';
import { useCart } from '@/contexts/CartContext';
import type { Order, OrderStatus } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_EMOJI, formatCurrency, formatShortDate, isActiveOrder, storeId as getStoreId, storeName as getStoreName } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'OrderHistory'>;

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'placed,accepted,processing,ready' },
  { label: 'Done', value: 'picked_up' },
  { label: 'Cancelled', value: 'cancelled' },
];

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const status = order.order_status as OrderStatus;
  const isActive = isActiveOrder(status);
  const storeName = getStoreName(order.store_id as any);

  return (
    <Pressable onPress={onPress}>
      <Surface style={[styles.orderCard, { backgroundColor: isActive ? c.elevation.level2 : c.surface }]} elevation={isActive ? 2 : 1}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700' }}>
              #{order.order_number}
            </Text>
            {storeName ? (
              <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>🏪 {storeName}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? c.primaryContainer : status === 'cancelled' ? c.errorContainer : c.elevation.level3 }]}>
            <Text style={{ fontSize: 14 }}>{ORDER_STATUS_EMOJI[status]}</Text>
            <Text variant="labelSmall" style={{ color: isActive ? c.onPrimaryContainer : status === 'cancelled' ? c.onErrorContainer : c.onSurface, marginLeft: 4, fontWeight: '600' }}>
              {ORDER_STATUS_LABELS[status]}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: spacing.xs }}>
          {order.items.length} item{order.items.length > 1 ? 's' : ''}  ·  {formatCurrency(order.total_amount)}
        </Text>
        <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginTop: 2 }}>
          {formatShortDate(order.created_at)}
        </Text>

        {isActive && (
          <View style={[styles.liveChip, { backgroundColor: c.primary }]}>
            <Text style={{ color: c.onPrimary, fontSize: 10, fontWeight: '700' }}>● LIVE</Text>
          </View>
        )}
      </Surface>
    </Pressable>
  );
}

export default function OrderHistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const c = theme.colors;

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list(filter ? { status: filter } : undefined);
      if (data.success) setOrders(data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); fetchOrders(); }, [fetchOrders]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>My Orders 🧾</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
            style={{ marginRight: spacing.xs }}
            showSelectedOverlay
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[c.primary]} />}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📭</Text>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '600', marginTop: spacing.base }}>No orders yet</Text>
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                Your order history will appear here
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
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
  filters: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingBottom: spacing.md, flexWrap: 'nowrap' },
  orderCard: { borderRadius: radius.xl, padding: spacing.base, position: 'relative', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  liveChip: { position: 'absolute', top: spacing.sm, left: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  center: { paddingTop: 60, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
});
