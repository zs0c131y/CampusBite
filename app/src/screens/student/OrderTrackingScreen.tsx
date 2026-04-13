import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ScreenBars } from '@/components/ScreenBars';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { OrderTrackingScreenProps } from '@/navigation/types';
import { ORDER_STATUS_LABELS, formatTime, formatCurrency } from '@/utils';
import { requestNotificationPermission, setupNotificationChannel, sendOrderStatusNotification } from '@/utils/notifications';
import { spacing, radius } from '@/theme';

const STATUS_ICON: Record<OrderStatus, string> = {
  placed:     'clock-outline',
  accepted:   'check-circle-outline',
  processing: 'silverware-fork-knife',
  ready:      'bell-ring',
  picked_up:  'shopping-outline',
  cancelled:  'close-circle-outline',
};

const STATUS_STEPS: OrderStatus[] = ['placed', 'accepted', 'processing', 'ready', 'picked_up'];

export default function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const { orderId } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const prevStatus = useRef<OrderStatus | null>(null);
  const c = theme.colors;

  // Pulse animation for "ready" state
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await ordersApi.get(orderId);
      if (data.success) {
        const newOrder = data.data;
        // Haptic on status change
        if (prevStatus.current && prevStatus.current !== newOrder.order_status) {
          const newStatus = newOrder.order_status as OrderStatus;
          sendOrderStatusNotification(newStatus, newOrder.order_number);
          if (newStatus === 'ready') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Pulse for ~5 seconds (4 cycles × 1.2s) then stop
            pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 600 }), withTiming(1, { duration: 600 })), 4, true);
          } else if (newStatus === 'picked_up' || newStatus === 'cancelled') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        prevStatus.current = newOrder.order_status;
        setOrder(newOrder);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    requestNotificationPermission().then(setupNotificationChannel);
  }, []);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => {
      // Stop polling once order reaches a terminal state
      if (prevStatus.current && ['picked_up', 'cancelled'].includes(prevStatus.current)) {
        clearInterval(interval);
        return;
      }
      fetchOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading || !order) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.order_status as OrderStatus);
  const isReady = order.order_status === 'ready';
  const isPickedUp = order.order_status === 'picked_up';
  const isDone = isPickedUp || order.order_status === 'cancelled';
  const isCancelled = order.order_status === 'cancelled';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBars style="dark" backgroundColor={String(c.surface)} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={c.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.onSurface }]}>
          Order #{order.order_number}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        entering={FadeIn.duration(220)}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View>
          <Animated.View style={[styles.statusHero, {
            backgroundColor: isPickedUp
              ? c.secondaryContainer ?? c.primaryContainer
              : isReady ? c.primaryContainer
              : isCancelled ? c.errorContainer
              : c.elevation.level2,
          }, isReady && pulseStyle]}>
            <View style={[styles.statusIconWrap, {
              backgroundColor: isPickedUp
                ? (c.secondary ?? c.primary) + '25'
                : isReady ? c.primary + '20'
                : isCancelled ? c.error + '20'
                : c.primary + '15',
            }]}>
              <MaterialCommunityIcons
                name={isPickedUp ? 'check-circle' : (STATUS_ICON[order.order_status as OrderStatus] ?? 'package-variant') as any}
                size={48}
                color={isPickedUp
                  ? c.secondary ?? c.primary
                  : isReady ? c.primary
                  : isCancelled ? c.error
                  : c.primary}
              />
            </View>
            <Text style={[styles.statusTitle, {
              color: isPickedUp
                ? c.onSecondaryContainer ?? c.onPrimaryContainer
                : isReady ? c.onPrimaryContainer
                : isCancelled ? c.onErrorContainer
                : c.onSurface,
            }]}>
              {isPickedUp ? 'Order Complete!' : ORDER_STATUS_LABELS[order.order_status as OrderStatus] ?? order.order_status}
            </Text>
            {isPickedUp && (
              <Text style={{ color: c.onSecondaryContainer ?? c.onPrimaryContainer, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'center' }}>
                Enjoy your meal!
              </Text>
            )}
            {isReady && (
              <View style={styles.otpHint}>
                <MaterialCommunityIcons name="arrow-down-circle-outline" size={16} color={c.onPrimaryContainer} />
                <Text style={{ color: c.onPrimaryContainer, fontFamily: 'Inter_400Regular', marginLeft: 5 }}>
                  Show your OTP at the counter
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* OTP display */}
        {isReady && order.otp && (
          <Surface style={[styles.otpCard, { backgroundColor: c.primary }]} elevation={2}>
            <Text variant="labelLarge" style={{ color: c.onPrimary, opacity: 0.8, marginBottom: 4 }}>
              PICKUP OTP
            </Text>
            <Text
              style={[styles.otpText, { color: c.onPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {order.otp.split('').join('  ')}
            </Text>
            <Text variant="bodySmall" style={{ color: c.onPrimary, opacity: 0.7, marginTop: 8 }}>
              Share this with the store employee
            </Text>
          </Surface>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="map-marker-path" size={18} color={c.primary} />
                <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Order Progress</Text>
              </View>
              {STATUS_STEPS.map((status, i) => {
                const isCompleted = currentStepIndex >= i;
                const isCurrent = STATUS_STEPS.indexOf(order.order_status as OrderStatus) === i;
                const stepColor = isCompleted ? c.primary : c.outlineVariant;

                return (
                  <View key={status} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: isCompleted ? c.primary : c.surfaceVariant, borderColor: stepColor, borderWidth: 2 }]}>
                        {isCompleted && <MaterialCommunityIcons name="check" size={12} color={c.onPrimary} />}
                      </View>
                      {i < STATUS_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: currentStepIndex > i ? c.primary : c.outlineVariant }]} />
                      )}
                    </View>
                    <View style={[styles.timelineContent, { paddingBottom: i < STATUS_STEPS.length - 1 ? spacing.lg : 0 }]}>
                      <MaterialCommunityIcons
                        name={STATUS_ICON[status] as any}
                        size={15}
                        color={isCompleted ? c.primary : c.onSurfaceVariant}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{
                        color: isCompleted ? c.onSurface : c.onSurfaceVariant,
                        fontFamily: isCurrent ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        fontSize: isCurrent ? 14 : 13,
                      }}>
                        {ORDER_STATUS_LABELS[status]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Surface>
        )}

        {/* Order details */}
        <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="receipt-text" size={18} color={c.primary} />
            <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Items</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i} style={styles.orderItem}>
              <Text style={{ color: c.onSurface, fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 }}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={{ color: c.onSurface, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
          <View style={[styles.orderItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.outlineVariant, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
            <Text style={{ color: c.onSurface, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Total</Text>
            <Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 15 }}>{formatCurrency(order.total_amount)}</Text>
          </View>
        </Surface>

        {/* Payment confirmation (if still pending) */}
        {order.payment_status === 'pending' && !isDone && (
          <Surface style={[styles.card, { backgroundColor: c.primaryContainer, marginTop: spacing.md }]} elevation={0}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={c.onPrimaryContainer} />
              <Text style={{ color: c.onPrimaryContainer, fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 }}>
                Waiting for the store to confirm your payment.
              </Text>
            </View>
          </Surface>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  statusHero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  statusIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  statusTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  otpHint: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  otpCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  otpText: { fontSize: 48, fontFamily: 'Inter_700Bold', letterSpacing: 6 },
  card: { borderRadius: radius.xl, padding: spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md, flex: 1 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
});
