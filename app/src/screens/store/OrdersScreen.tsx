import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, Surface, Chip, Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { StoreStackParamList } from '@/navigation/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_EMOJI, formatCurrency, formatTime } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StoreStackParamList, 'Orders'>;

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: string }>> = {
  placed:     { label: 'Accept Order', next: 'accepted' },
  accepted:   { label: 'Start Preparing', next: 'processing' },
  processing: { label: 'Mark Ready', next: 'ready' },
};

function OrderRow({ order, onPress, onAction }: { order: Order; onPress: () => void; onAction: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const status = order.order_status as OrderStatus;
  const next = NEXT_STATUS[status];
  const isUrgent = status === 'placed';

  return (
    <Pressable onPress={onPress}>
      <Surface style={[styles.orderCard, { backgroundColor: isUrgent ? c.primaryContainer + '60' : c.surface, borderColor: isUrgent ? c.primary : 'transparent', borderWidth: isUrgent ? 1.5 : 0 }]} elevation={1}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700' }}>#{order.order_number}</Text>
            <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginTop: 2 }}>
              🕐 {formatTime(order.created_at)}  ·  {order.items.length} items  ·  {formatCurrency(order.total_amount)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isUrgent ? c.primary : c.elevation.level3 }]}>
            <Text style={{ fontSize: 14 }}>{ORDER_STATUS_EMOJI[status]}</Text>
            <Text variant="labelSmall" style={{ color: isUrgent ? c.onPrimary : c.onSurface, marginLeft: 4, fontWeight: '600' }}>
              {ORDER_STATUS_LABELS[status]}
            </Text>
          </View>
        </View>

        {/* Items preview */}
        <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginTop: spacing.sm }} numberOfLines={1}>
          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
        </Text>

        {/* Action button */}
        {next && (
          <Button
            mode="contained"
            compact
            onPress={(e) => { e.stopPropagation?.(); onAction(); }}
            style={[styles.actionBtn, { backgroundColor: c.primary }]}
            labelStyle={{ color: c.onPrimary, fontSize: 13, fontWeight: '600' }}
          >
            {next.label} →
          </Button>
        )}

        {status === 'ready' && (
          <Button
            mode="outlined"
            compact
            onPress={(e) => { e.stopPropagation?.(); onPress(); }}
            style={styles.actionBtn}
            labelStyle={{ fontSize: 13 }}
          >
            Verify OTP & Complete
          </Button>
        )}
      </Surface>
    </Pressable>
  );
}

export default function StoreOrdersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('placed,accepted,processing,ready');
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

  // Auto-refresh active orders
  useEffect(() => {
    if (filter.includes('placed')) {
      const interval = setInterval(fetchOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, filter]);

  const handleAction = async (order: Order) => {
    const status = order.order_status as OrderStatus;
    const next = NEXT_STATUS[status];
    if (!next) return;

    // Confirm payment before accepting
    if (status === 'placed') {
      Alert.alert(
        'Confirm payment?',
        `Mark payment as received and accept order #${order.order_number}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await ordersApi.confirmPayment(order._id);
                await ordersApi.updateStatus(order._id, next.next);
                fetchOrders();
              } catch (e: any) {
                Alert.alert('Error', e.response?.data?.message ?? 'Failed to update order.');
              }
            },
          },
        ],
      );
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await ordersApi.updateStatus(order._id, next.next);
      fetchOrders();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to update order.');
    }
  };

  const FILTERS = [
    { label: '🔴 Active', value: 'placed,accepted,processing,ready' },
    { label: '✅ Done', value: 'picked_up' },
    { label: '📋 All', value: '' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>Orders 🍽️</Text>
        <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>
          {orders.length} showing
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f.value} selected={filter === f.value} onPress={() => setFilter(f.value)} style={{ marginRight: spacing.xs }} showSelectedOverlay compact>
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
              <Text style={{ fontSize: 56 }}>🎉</Text>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '600', marginTop: spacing.base }}>
                No orders here
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <OrderRow
              order={item}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
              onAction={() => handleAction(item)}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  orderCard: { borderRadius: radius.xl, padding: spacing.base },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  actionBtn: { marginTop: spacing.md, borderRadius: radius.lg },
  center: { paddingTop: 60, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center' },
});
