import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ordersApi } from '@/api/orders';
import { useAuth } from '@/contexts/AuthContext';
import type { Order } from '@/api/types';
import { formatCurrency, getGreeting } from '@/utils';
import { spacing, radius } from '@/theme';

interface Stats {
  totalToday: number;
  revenueToday: number;
  pending: number;
  completed: number;
}

function StatCard({ emoji, label, value, color, bgColor }: { emoji: string; label: string; value: string; color: string; bgColor: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <Text style={{ fontSize: 32, marginBottom: spacing.xs }}>{emoji}</Text>
      <Text variant="headlineSmall" style={{ color, fontWeight: '700' }}>{value}</Text>
      <Text variant="bodySmall" style={{ color, opacity: 0.75, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const c = theme.colors;

  const greeting = getGreeting(user?.name);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await ordersApi.list();
      if (data.success) setOrders(data.data ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);

  const stats: Stats = {
    totalToday: todayOrders.length,
    revenueToday: todayOrders.filter((o) => o.payment_status === 'success').reduce((s, o) => s + o.total_amount, 0),
    pending: orders.filter((o) => ['placed', 'accepted', 'processing'].includes(o.order_status)).length,
    completed: orders.filter((o) => o.order_status === 'picked_up').length,
  };

  // Last 5 orders
  const recent = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant }}>{greeting.emoji} {greeting.text}</Text>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>Dashboard 📊</Text>
      </View>

      <Animated.ScrollView
        entering={FadeIn.duration(220)}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[c.primary]} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard emoji="📦" label="Orders today" value={stats.totalToday.toString()} color={c.onPrimaryContainer} bgColor={c.primaryContainer} />
          <StatCard emoji="💰" label="Revenue today" value={formatCurrency(stats.revenueToday)} color={c.onTertiaryContainer} bgColor={c.tertiaryContainer} />
          <StatCard emoji="⏳" label="Pending" value={stats.pending.toString()} color={c.onSecondaryContainer} bgColor={c.secondaryContainer} />
          <StatCard emoji="✅" label="Completed" value={stats.completed.toString()} color={c.onSurface} bgColor={c.elevation.level3} />
        </View>

        {/* Recent orders */}
        {recent.length > 0 && (
          <View>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.onSurface }]}>Recent Orders</Text>
            <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
              {recent.map((order, i) => (
                <View key={order._id} style={[styles.orderRow, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.outlineVariant }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="labelLarge" style={{ color: c.onSurface, fontWeight: '600' }}>#{order.order_number}</Text>
                    <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>{order.items.length} items</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyMedium" style={{ color: c.primary, fontWeight: '700' }}>{formatCurrency(order.total_amount)}</Text>
                    <View style={[styles.miniStatus, { backgroundColor: ['placed', 'accepted', 'processing', 'ready'].includes(order.order_status) ? c.primaryContainer : c.elevation.level3 }]}>
                      <Text variant="labelSmall" style={{ color: c.onSurface, fontSize: 10 }}>{order.order_status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Surface>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { width: '47.5%', borderRadius: radius.xl, padding: spacing.base },
  sectionTitle: { fontWeight: '700', marginBottom: spacing.md },
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  orderRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  miniStatus: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 4 },
});
