import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Button, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { colors: c } = useTheme();
  const status  = order.order_status as OrderStatus;
  const next    = NEXT_STATUS[status];
  const isActive = status === 'placed' || status === 'accepted' || status === 'processing' || status === 'ready';

  // For placed orders, derive what the action button should show:
  // 1. payment pending  → "Confirm Payment" (opens dialog)
  // 2. payment done, commitment pending → disabled "Waiting for customer…"
  // 3. payment done, commitment confirmed (or not required) → "Accept Order"
  const paymentPending = status === 'placed' && order.payment_status === 'pending';
  const waitingCommitment = status === 'placed' && order.payment_status === 'success' && !order.is_commitment_confirmed;

  const iconBg  = isActive ? c.primaryContainer : c.surfaceVariant;
  const iconFg  = isActive ? c.onPrimaryContainer : c.onSurfaceVariant;
  const labelFg = isActive ? c.primary : c.onSurfaceVariant;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isActive ? c.elevation.level2 : c.surface,
            borderColor: isActive ? c.primary + '55' : c.outlineVariant,
            borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {/* Left accent strip */}
        {isActive && <View style={[styles.accentStrip, { backgroundColor: c.primary }]} />}

        {/* Status icon */}
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={STATUS_ICON[status] as any} size={22} color={iconFg} />
        </View>

        {/* Main content */}
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={[styles.orderNum, { color: c.onSurface }]}>#{order.order_number}</Text>
            {isActive && (
              <View style={[styles.liveBadge, { backgroundColor: c.primary }]}>
                <View style={[styles.liveDot, { backgroundColor: c.onPrimary }]} />
                <Text style={[styles.liveText, { color: c.onPrimary }]}>LIVE</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.onSurfaceVariant} />
          </View>

          <Text style={[styles.itemsText, { color: c.onSurfaceVariant }]} numberOfLines={1}>
            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
          </Text>

          <View style={[styles.divider, { backgroundColor: c.outlineVariant }]} />

          <View style={styles.footerRow}>
            <View style={[styles.statusPill, { backgroundColor: iconBg }]}>
              <Text style={[styles.statusPillText, { color: labelFg }]}>
                {ORDER_STATUS_LABELS[status]}
              </Text>
            </View>
            <View style={styles.metaGroup}>
              <MaterialCommunityIcons name="shopping-outline" size={12} color={c.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>{order.items.length}</Text>
              <Text style={[styles.metaDot, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.metaAmount, { color: c.onSurface }]}>{formatCurrency(order.total_amount)}</Text>
              <Text style={[styles.metaDot, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>{formatTime(order.created_at)}</Text>
            </View>
          </View>

          {status === 'placed' && paymentPending && (
            <Button
              mode="contained"
              onPress={(e) => { e.stopPropagation?.(); onAction(); }}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={{ fontSize: 13, fontFamily: 'Inter_600SemiBold' }}
              icon="cash-check"
            >
              Confirm Payment
            </Button>
          )}
          {status === 'placed' && waitingCommitment && (
            <Button
              mode="contained-tonal"
              disabled
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}
              icon="clock-outline"
            >
              Waiting for customer…
            </Button>
          )}
          {status === 'placed' && !paymentPending && !waitingCommitment && (
            <Button
              mode="contained"
              onPress={(e) => { e.stopPropagation?.(); onAction(); }}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={{ fontSize: 13, fontFamily: 'Inter_600SemiBold' }}
              icon="check-circle-outline"
            >
              Accept Order
            </Button>
          )}
          {next && status !== 'placed' && (
            <Button
              mode="contained"
              onPress={(e) => { e.stopPropagation?.(); onAction(); }}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={{ fontSize: 13, fontFamily: 'Inter_600SemiBold' }}
              icon="arrow-right"
            >
              {next.label}
            </Button>
          )}
          {status === 'ready' && (
            <Button
              mode="outlined"
              onPress={(e) => { e.stopPropagation?.(); onPress(); }}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}
              icon="shield-check-outline"
            >
              Verify OTP &amp; Complete
            </Button>
          )}
        </View>

      </View>
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

    // Placed + payment pending → open payment confirmation dialog
    if (status === 'placed' && order.payment_status === 'pending') {
      setConfirmOrder(order);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await ordersApi.updateStatus(order._id, next.next);
      await fetchOrders();
    } catch (e: any) {
      console.error('updateStatus error:', (e as any).response?.data ?? e);
    }
  };

  // Only confirms payment — does NOT accept the order.
  // After payment is confirmed the card re-renders: either "Waiting for customer"
  // (if commitment is required) or "Accept Order" (if commitment is not needed).
  const handleConfirmPayment = async () => {
    if (!confirmOrder) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await ordersApi.confirmPayment(confirmOrder._id);
      await fetchOrders();
    } catch (e: any) {
      console.error('confirmPayment error:', (e as any).response?.data ?? e);
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
      <View style={[styles.filterRow, { backgroundColor: c.surfaceVariant }]}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterPill,
                active && { backgroundColor: c.primary },
              ]}
            >
              <MaterialCommunityIcons
                name={f.icon as any}
                size={14}
                color={active ? c.onPrimary : c.onSurfaceVariant}
              />
              <Text style={[styles.filterPillText, { color: active ? c.onPrimary : c.onSurfaceVariant }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
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
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderRadius: radius.full,
    padding: 4,
    gap: 2,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.xl,
    overflow: 'hidden',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    gap: spacing.md,
  },
  accentStrip: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
  },
  iconCircle: {
    width: 48, height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    marginTop: 2,
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderNum: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  itemsText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaDot: { fontSize: 12 },
  metaAmount: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  actionBtn: { marginTop: spacing.xs, borderRadius: radius.lg },
  actionBtnContent: { height: 44, paddingHorizontal: spacing.sm },

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
