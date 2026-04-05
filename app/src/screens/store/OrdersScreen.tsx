import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Chip, Button, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { StoreStackParamList } from '@/navigation/types';
import { ORDER_STATUS_LABELS, formatCurrency, formatTime } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StoreStackParamList, 'Orders'>;

// Icon for each order status
const STATUS_ICON: Record<OrderStatus, string> = {
  placed:     'clock-outline',
  accepted:   'check-circle-outline',
  processing: 'silverware-fork-knife',
  ready:      'bell-ring',
  picked_up:  'shopping-outline',
  cancelled:  'close-circle-outline',
};

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: string }>> = {
  placed:     { label: 'Accept Order',   next: 'accepted' },
  accepted:   { label: 'Start Preparing', next: 'processing' },
  processing: { label: 'Mark Ready',     next: 'ready' },
};

const FILTERS = [
  { label: 'Active', value: 'placed,accepted,processing,ready', icon: 'lightning-bolt' },
  { label: 'Done',   value: 'picked_up',                        icon: 'check-circle-outline' },
  { label: 'All',    value: '',                                  icon: 'format-list-bulleted' },
];

function OrderRow({ order, onPress, onAction }: { order: Order; onPress: () => void; onAction: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const status = order.order_status as OrderStatus;
  const next = NEXT_STATUS[status];
  const isUrgent = status === 'placed';

  const badgeBg = isUrgent ? c.primary : c.elevation.level3;
  const badgeFg = isUrgent ? c.onPrimary : c.onSurface;

  return (
    <Pressable onPress={onPress}>
      <Surface
        style={[
          styles.orderCard,
          {
            backgroundColor: isUrgent ? c.primaryContainer + '40' : c.surface,
            borderWidth: isUrgent ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: isUrgent ? c.primary : c.outlineVariant,
          },
        ]}
        elevation={1}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderNumber, { color: c.onSurface }]}>
              #{order.order_number}
            </Text>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={c.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>
                {formatTime(order.created_at)}
              </Text>
              <Text style={[styles.metaDot, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </Text>
              <Text style={[styles.metaDot, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.metaText, { color: c.onSurface, fontFamily: 'Inter_600SemiBold' }]}>
                {formatCurrency(order.total_amount)}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <MaterialCommunityIcons name={STATUS_ICON[status] as any} size={13} color={badgeFg} />
            <Text style={[styles.statusLabel, { color: badgeFg }]}>
              {ORDER_STATUS_LABELS[status]}
            </Text>
          </View>
        </View>

        {/* Items preview */}
        <View style={styles.itemsRow}>
          <MaterialCommunityIcons name="food-variant" size={13} color={c.onSurfaceVariant} />
          <Text style={[styles.itemsText, { color: c.onSurfaceVariant }]} numberOfLines={1}>
            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
          </Text>
        </View>

        {/* Action button */}
        {next && (
          <Button
            mode="contained"
            compact
            onPress={(e) => { e.stopPropagation?.(); onAction(); }}
            style={[styles.actionBtn, { backgroundColor: c.primary }]}
            labelStyle={{ color: c.onPrimary, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}
            icon="arrow-right"
          >
            {next.label}
          </Button>
        )}

        {status === 'ready' && (
          <Button
            mode="outlined"
            compact
            onPress={(e) => { e.stopPropagation?.(); onPress(); }}
            style={styles.actionBtn}
            labelStyle={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}
            icon="shield-check-outline"
          >
            Verify OTP &amp; Complete
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
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
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

    if (status === 'placed') {
      setConfirmOrder(order);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await ordersApi.updateStatus(order._id, next.next);
      fetchOrders();
    } catch (e: any) {
      // surface error inline — could replace with Snackbar if desired
      console.error(e);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmOrder) return;
    const next = NEXT_STATUS[confirmOrder.order_status as OrderStatus];
    if (!next) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await ordersApi.confirmPayment(confirmOrder._id);
      await ordersApi.updateStatus(confirmOrder._id, next.next);
      fetchOrders();
    } catch (e: any) {
      console.error(e);
    } finally {
      setConfirmOrder(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={c.primary} />
          <Text style={[styles.headerText, { color: c.onSurface }]}>Orders</Text>
        </View>
        <Text style={[styles.countText, { color: c.onSurfaceVariant }]}>
          {orders.length > 0 ? `${orders.length} showing` : ''}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
            style={{ marginRight: spacing.xs }}
            showSelectedOverlay
            compact
            icon={f.icon}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <Animated.FlatList
        entering={FadeIn.duration(220)}
        key={filter}
        data={orders}
        keyExtractor={(o) => o._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            colors={[c.primary]}
            tintColor={c.primary}
          />
        }
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.surfaceVariant }]}>
                <MaterialCommunityIcons name="check-all" size={40} color={c.onSurfaceVariant} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.onSurface }]}>All clear</Text>
              <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>
                No orders in this category
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
            onAction={() => handleAction(item)}
          />
        )}
      />

      {/* Payment confirmation dialog */}
      <Portal>
        <Dialog
          visible={!!confirmOrder}
          onDismiss={() => setConfirmOrder(null)}
          style={{ borderRadius: radius.xl, backgroundColor: c.surface }}
        >
          <Dialog.Icon icon="cash-check" size={40} />
          <Dialog.Title style={{ textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
            Confirm Payment?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              Mark payment as received and accept order{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
                #{confirmOrder?.order_number}
              </Text>
              ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: spacing.base }}>
            <Button
              onPress={() => setConfirmOrder(null)}
              labelStyle={{ color: c.onSurfaceVariant, fontFamily: 'Inter_500Medium' }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmPayment}
              style={{ borderRadius: radius.lg }}
              labelStyle={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  countText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },

  // Card
  orderCard: { borderRadius: radius.xl, padding: spacing.base },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  orderNumber: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaDot: { fontSize: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 150,
  },
  statusLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.xs },
  itemsText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  actionBtn: { marginTop: spacing.md, borderRadius: radius.lg },

  // Empty
  center: { paddingTop: 60, alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
