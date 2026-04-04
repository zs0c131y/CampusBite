import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated as RNAnimated } from 'react-native';
import { Text, useTheme, Surface, Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { OrderTrackingScreenProps } from '@/navigation/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_EMOJI, formatTime, formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

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
          if (newOrder.order_status === 'ready') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
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
    fetchOrder();
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchOrder, 5000);
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
  const isDone = ['picked_up', 'cancelled'].includes(order.order_status);
  const isCancelled = order.order_status === 'cancelled';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: c.primary }}>← Back</Text>
        </Pressable>
        <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>
          Order #{order.order_number}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <Animated.View entering={FadeInDown.springify()}>
          <Animated.View style={[styles.statusHero, {
            backgroundColor: isReady ? c.primaryContainer : isCancelled ? c.errorContainer : c.elevation.level2,
          }, isReady && pulseStyle]}>
            <Text style={styles.statusEmoji}>
              {ORDER_STATUS_EMOJI[order.order_status as OrderStatus] ?? '📦'}
            </Text>
            <Text variant="headlineSmall" style={{ color: isReady ? c.onPrimaryContainer : isCancelled ? c.onErrorContainer : c.onSurface, fontWeight: '700', textAlign: 'center' }}>
              {ORDER_STATUS_LABELS[order.order_status as OrderStatus] ?? order.order_status}
            </Text>
            {isReady && (
              <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer, marginTop: 4, textAlign: 'center' }}>
                Show your OTP at the counter 👇
              </Text>
            )}
          </Animated.View>
        </Animated.View>

        {/* OTP display */}
        {isReady && order.otp && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Surface style={[styles.otpCard, { backgroundColor: c.primary }]} elevation={2}>
              <Text variant="labelLarge" style={{ color: c.onPrimary, opacity: 0.8, marginBottom: 4 }}>
                PICKUP OTP
              </Text>
              <Text style={[styles.otpText, { color: c.onPrimary }]}>
                {order.otp.split('').join(' ')}
              </Text>
              <Text variant="bodySmall" style={{ color: c.onPrimary, opacity: 0.7, marginTop: 8 }}>
                Share this with the store employee
              </Text>
            </Surface>
          </Animated.View>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
              <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.lg }}>
                📍 Order Progress
              </Text>
              {STATUS_STEPS.filter((s) => s !== 'picked_up' || isDone).map((status, i) => {
                const isCompleted = currentStepIndex >= i;
                const isCurrent = STATUS_STEPS.indexOf(order.order_status as OrderStatus) === i;
                const stepColor = isCompleted ? c.primary : c.outlineVariant;

                return (
                  <View key={status} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: isCompleted ? c.primary : c.surfaceVariant, borderColor: stepColor, borderWidth: 2 }]}>
                        {isCompleted && <Text style={{ fontSize: 10 }}>✓</Text>}
                      </View>
                      {i < STATUS_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: currentStepIndex > i ? c.primary : c.outlineVariant }]} />
                      )}
                    </View>
                    <Text
                      variant={isCurrent ? 'titleSmall' : 'bodyMedium'}
                      style={{ color: isCompleted ? c.onSurface : c.onSurfaceVariant, fontWeight: isCurrent ? '700' : '400', marginLeft: spacing.md, paddingBottom: i < STATUS_STEPS.length - 1 ? spacing.lg : 0 }}
                    >
                      {ORDER_STATUS_EMOJI[status]} {ORDER_STATUS_LABELS[status]}
                    </Text>
                  </View>
                );
              })}
            </Surface>
          </Animated.View>
        )}

        {/* Order details */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={{ marginTop: spacing.md }}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
            <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.md }}>
              🧾 Items
            </Text>
            {order.items.map((item, i) => (
              <View key={i} style={styles.orderItem}>
                <Text variant="bodyMedium" style={{ color: c.onSurface, flex: 1 }}>
                  {item.name} × {item.quantity}
                </Text>
                <Text variant="bodyMedium" style={{ color: c.onSurface, fontWeight: '600' }}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
            <View style={[styles.orderItem, { borderTopWidth: 1, borderTopColor: c.outlineVariant, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700' }}>Total</Text>
              <Text variant="titleSmall" style={{ color: c.primary, fontWeight: '700' }}>{formatCurrency(order.total_amount)}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Payment confirmation (if still pending) */}
        {order.payment_status === 'pending' && !isDone && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: spacing.md }}>
            <Surface style={[styles.card, { backgroundColor: c.warningContainer ?? c.primaryContainer }]} elevation={0}>
              <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer }}>
                ⏳ Waiting for the store to confirm your payment.
              </Text>
            </Surface>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  statusHero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  statusEmoji: { fontSize: 64, marginBottom: spacing.md },
  otpCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md },
  otpText: { fontSize: 48, fontWeight: '700', letterSpacing: 12 },
  card: { borderRadius: radius.xl, padding: spacing.base },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
});
