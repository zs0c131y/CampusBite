import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ordersApi } from '@/api/orders';
import { storesApi, resolveStores } from '@/api/stores';
import { useAuth } from '@/contexts/AuthContext';
import type { Order, Store } from '@/api/types';
import { formatCurrency, formatTime, getGreeting, ORDER_STATUS_LABELS } from '@/utils';
import { spacing, radius } from '@/theme';
import { ScreenBars } from '@/components/ScreenBars';

const STATUS_COLOR: Record<string, string> = {
  placed: '#C56200',
  accepted: '#5D6024',
  processing: '#755945',
  ready: '#2E7D32',
  picked_up: '#53433C',
  cancelled: '#BA1A1A',
};

function StatPill({
  icon, label, value, color, bg,
}: { icon: string; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = getGreeting(user?.name);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, storesRes] = await Promise.all([
        ordersApi.list(),
        storesApi.list(),
      ]);
      if (ordersRes.data.success) setOrders(ordersRes.data.data ?? []);
      if (storesRes.data.success) {
        const list = resolveStores(storesRes.data.data as any);
        const mine = list.find((s) => s.owner_id === user?._id);
        if (mine) setStore(mine);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const revenueToday = todayOrders
    .filter((o) => o.payment_status === 'success')
    .reduce((s, o) => s + o.total_amount, 0);
  const pending = orders.filter((o) => ['placed', 'accepted', 'processing'].includes(o.order_status));
  const completed = orders.filter((o) => o.order_status === 'picked_up').length;
  const recent = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBars style="dark" backgroundColor={c.elevation.level2 as string} />
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: c.elevation.level2 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greetingText, { color: c.onSurfaceVariant }]}>
              {greeting.emoji}  {greeting.text}
            </Text>
            <Text style={[styles.storeName, { color: c.onSurface }]}>
              {store?.name ?? 'Your Store'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: store?.is_active ? '#E8F5E9' : c.surfaceVariant },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: store?.is_active ? '#2E7D32' : c.onSurfaceVariant },
            ]} />
            <Text style={[
              styles.statusText,
              { color: store?.is_active ? '#2E7D32' : c.onSurfaceVariant },
            ]}>
              {store?.is_active ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              colors={[c.primary]}
              tintColor={c.primary}
            />
          }
        >
          {/* ── Revenue hero ─────────────────────────────────────────────── */}
          <View style={[styles.revenueCard, { backgroundColor: c.primary }]}>
            <View style={styles.revenueTop}>
              <Text style={[styles.revenueLabel, { color: c.onPrimary + 'CC' }]}>Today's Revenue</Text>
              <MaterialCommunityIcons name="trending-up" size={20} color={c.onPrimary + 'CC'} />
            </View>
            <Text style={[styles.revenueAmount, { color: c.onPrimary }]}>
              {formatCurrency(revenueToday)}
            </Text>
            <Text style={[styles.revenueSubtext, { color: c.onPrimary + 'AA' }]}>
              {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} placed today
            </Text>
          </View>

          {/* ── Stats row ────────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatPill
              icon="receipt"
              label="Today"
              value={todayOrders.length.toString()}
              color={c.onPrimaryContainer}
              bg={c.primaryContainer}
            />
            <StatPill
              icon="clock-outline"
              label="Pending"
              value={pending.length.toString()}
              color={c.onSecondaryContainer}
              bg={c.secondaryContainer}
            />
            <StatPill
              icon="check-circle-outline"
              label="Done"
              value={completed.toString()}
              color={c.onTertiaryContainer}
              bg={c.tertiaryContainer}
            />
          </View>

          {/* ── Active orders ─────────────────────────────────────────────── */}
          {pending.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Active Orders</Text>
                <View style={[styles.liveChip, { backgroundColor: c.primary }]}>
                  <View style={[styles.liveDot, { backgroundColor: c.onPrimary }]} />
                  <Text style={[styles.liveChipText, { color: c.onPrimary }]}>LIVE</Text>
                </View>
              </View>
              <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
                {pending.map((order, i) => (
                  <View
                    key={order._id}
                    style={[
                      styles.activeRow,
                      i < pending.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.outlineVariant },
                    ]}
                  >
                    <View style={[styles.statusDotLg, { backgroundColor: STATUS_COLOR[order.order_status] ?? c.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activeOrderNum, { color: c.onSurface }]}>
                        #{order.order_number}
                      </Text>
                      <Text style={[styles.activeOrderItems, { color: c.onSurfaceVariant }]} numberOfLines={1}>
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <Text style={[styles.activeOrderAmount, { color: c.primary }]}>
                        {formatCurrency(order.total_amount)}
                      </Text>
                      <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[order.order_status] ?? c.primary) + '20' }]}>
                        <Text style={[styles.statusChipText, { color: STATUS_COLOR[order.order_status] ?? c.primary }]}>
                          {ORDER_STATUS_LABELS[order.order_status as keyof typeof ORDER_STATUS_LABELS]}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Recent activity ───────────────────────────────────────────── */}
          {recent.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Recent Activity</Text>
                <Text style={[styles.sectionMeta, { color: c.onSurfaceVariant }]}>Last {recent.length}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.outlineVariant }]}>
                {recent.map((order, i) => {
                  const isActive = ['placed', 'accepted', 'processing', 'ready'].includes(order.order_status);
                  return (
                    <View
                      key={order._id}
                      style={[
                        styles.recentRow,
                        i < recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.outlineVariant },
                      ]}
                    >
                      <View style={[styles.recentIconWrap, { backgroundColor: isActive ? c.primaryContainer : c.surfaceVariant }]}>
                        <MaterialCommunityIcons
                          name={isActive ? 'clock-outline' : order.order_status === 'cancelled' ? 'close-circle-outline' : 'check-circle-outline'}
                          size={16}
                          color={isActive ? c.onPrimaryContainer : c.onSurfaceVariant}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.recentOrderNum, { color: c.onSurface }]}>#{order.order_number}</Text>
                        <Text style={[styles.recentMeta, { color: c.onSurfaceVariant }]}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatTime(order.created_at)}
                        </Text>
                      </View>
                      <Text style={[styles.recentAmount, { color: isActive ? c.primary : c.onSurfaceVariant }]}>
                        {formatCurrency(order.total_amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {recent.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: c.surfaceVariant }]}>
                <MaterialCommunityIcons name="storefront-outline" size={40} color={c.onSurfaceVariant} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.onSurface }]}>No orders yet</Text>
              <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>Orders will appear here once customers start ordering</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  storeName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Revenue
  revenueCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  revenueTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  revenueLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  revenueAmount: { fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  revenueSubtext: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statPill: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  // Section
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sectionMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveChipText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  // Card shell
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  // Active order row
  activeRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  statusDotLg: { width: 8, height: 8, borderRadius: 4, marginTop: 2, flexShrink: 0 },
  activeOrderNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  activeOrderItems: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  activeOrderAmount: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  statusChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  // Recent row
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  recentIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recentOrderNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  recentMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  recentAmount: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 48, gap: spacing.sm },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
});
