import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl, ScrollView } from 'react-native';
import { Text, useTheme, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import {
  ORDER_STATUS_LABELS,
  formatCurrency,
  formatShortDate,
  isActiveOrder,
  storeName as getStoreName,
} from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'OrderHistory'>;

// ── Status config ─────────────────────────────────────────────────────────────

type StatusCfg = { icon: string; cardBg: string; iconBg: string; iconFg: string; labelFg: string };

function useStatusConfig(status: OrderStatus, c: any): StatusCfg {
  const isActive   = isActiveOrder(status);
  const isCancelled = status === 'cancelled';
  const isDone     = status === 'picked_up';

  if (isActive) {
    const iconMap: Record<string, string> = {
      placed: 'clock-outline', accepted: 'check-circle-outline',
      processing: 'silverware-fork-knife', ready: 'bell-ring',
    };
    return {
      icon:    iconMap[status] ?? 'clock-outline',
      cardBg:  c.elevation.level2,
      iconBg:  c.primaryContainer,
      iconFg:  c.onPrimaryContainer,
      labelFg: c.primary,
    };
  }
  if (isCancelled) return {
    icon: 'close-circle-outline',
    cardBg:  c.surface,
    iconBg:  c.errorContainer,
    iconFg:  c.onErrorContainer,
    labelFg: c.error,
  };
  if (isDone) return {
    icon: 'shopping-outline',
    cardBg:  c.surface,
    iconBg:  c.surfaceVariant,
    iconFg:  c.onSurfaceVariant,
    labelFg: c.onSurfaceVariant,
  };
  return {
    icon: 'help-circle-outline',
    cardBg:  c.surface,
    iconBg:  c.surfaceVariant,
    iconFg:  c.onSurfaceVariant,
    labelFg: c.onSurfaceVariant,
  };
}

// ── Filters ───────────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'All',       value: '',                                 icon: 'format-list-bulleted' },
  { label: 'Active',    value: 'placed,accepted,processing,ready', icon: 'lightning-bolt'       },
  { label: 'Done',      value: 'picked_up',                       icon: 'check-circle-outline' },
  { label: 'Cancelled', value: 'cancelled',                       icon: 'close-circle-outline' },
];

// ── Order card ────────────────────────────────────────────────────────────────

const OrderCard = React.memo(function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  const status    = order.order_status as OrderStatus;
  const isActive  = isActiveOrder(status);
  const storeName = getStoreName(order.store_id as any);
  const cfg       = useStatusConfig(status, c);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: cfg.cardBg,
            borderColor: isActive ? c.primary + '55' : c.outlineVariant,
            borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {/* Left accent strip for active orders */}
        {isActive && (
          <View style={[styles.accentStrip, { backgroundColor: c.primary }]} />
        )}

        {/* Status icon */}
        <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
          <MaterialCommunityIcons
            name={cfg.icon as any}
            size={22}
            color={cfg.iconFg}
          />
        </View>

        {/* Main content */}
        <View style={styles.cardBody}>
          {/* Row 1: order number + LIVE badge */}
          <View style={styles.row}>
            <Text style={[styles.orderNum, { color: c.onSurface }]}>
              #{order.order_number}
            </Text>
            {isActive && (
              <View style={[styles.liveBadge, { backgroundColor: c.primary }]}>
                <View style={[styles.liveDot, { backgroundColor: c.onPrimary }]} />
                <Text style={[styles.liveText, { color: c.onPrimary }]}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Row 2: store name */}
          {storeName ? (
            <Text style={[styles.storeText, { color: c.onSurfaceVariant }]} numberOfLines={1}>
              {storeName}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: c.outlineVariant }]} />

          {/* Row 3: status pill + meta */}
          <View style={styles.footerRow}>
            <View style={[styles.statusPill, { backgroundColor: cfg.iconBg }]}>
              <Text style={[styles.statusText, { color: cfg.labelFg }]}>
                {ORDER_STATUS_LABELS[status]}
              </Text>
            </View>
            <View style={styles.metaGroup}>
              <MaterialCommunityIcons
                name="shopping-outline"
                size={12}
                color={c.onSurfaceVariant}
              />
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>
                {order.items.length}
              </Text>
              <Text style={[styles.metaSep, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.amount, { color: c.onSurface }]}>
                {formatCurrency(order.total_amount ?? 0)}
              </Text>
              <Text style={[styles.metaSep, { color: c.outlineVariant }]}>·</Text>
              <Text style={[styles.metaText, { color: c.onSurfaceVariant }]}>
                {formatShortDate(order.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={c.onSurfaceVariant}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OrderHistoryScreen() {
  const { colors: c } = useTheme();
  const insets        = useSafeAreaInsets();
  const navigation    = useNavigation<Nav>();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('');

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
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.outlineVariant }]}>
        <Text style={[styles.title, { color: c.onSurface }]}>My Orders</Text>
        {orders.length > 0 && (
          <Text style={[styles.countBadge, { backgroundColor: c.primaryContainer, color: c.onPrimaryContainer }]}>
            {orders.length}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <Animated.FlatList
          key={filter}
          entering={FadeIn.duration(220)}
          style={{ flex: 1 }}
          data={orders}
          ListHeaderComponent={
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.chipScroll, { backgroundColor: c.surface, borderBottomColor: c.outlineVariant }]}
              contentContainerStyle={styles.chipRow}
            >
              {FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  selected={filter === f.value}
                  onPress={() => setFilter(f.value)}
                  showSelectedOverlay
                  compact
                >
                  {f.label}
                </Chip>
              ))}
            </ScrollView>
          }
          keyExtractor={(o) => o._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[c.primary]}
              tintColor={c.primary}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name="inbox-outline"
                  size={40}
                  color={c.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: c.onSurface }]}>No orders yet</Text>
              <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>
                Your order history will appear here
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
            />
          )}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', flex: 1 },
  countBadge: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  // Chips
  chipScroll: { marginBottom: spacing.sm },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },

  // List
  listContent: { padding: spacing.base },
  separator:   { height: spacing.sm },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    overflow: 'hidden',
    gap: spacing.md,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderNum:  { fontSize: 15, fontFamily: 'Inter_700Bold' },
  storeText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  divider:   { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText:  { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaSep:   { fontSize: 12 },
  amount:    { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  chevron:   { flexShrink: 0 },

  // LIVE badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  liveDot:  { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  // Empty / loading
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty:  { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub:   { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
