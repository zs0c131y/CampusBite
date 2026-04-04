import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, TextInput as RNTextInput } from 'react-native';
import { Text, useTheme, Surface, Button, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { OrderDetailScreenProps } from '@/navigation/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_EMOJI, formatCurrency, formatDate } from '@/utils';
import { spacing, radius } from '@/theme';

export default function OrderDetailScreen({ route, navigation }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const c = theme.colors;

  useEffect(() => {
    ordersApi.get(orderId).then(({ data }) => {
      if (data.success) setOrder(data.data);
    });
  }, [orderId]);

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.'); return; }
    setVerifying(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { data } = await ordersApi.verifyOtp(orderId, otp);
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Order Complete!', 'OTP verified. Order marked as picked up.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid OTP', e.response?.data?.message ?? 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (!order) return null;
  const status = order.order_status as OrderStatus;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: c.primary }}>← Back</Text>
        </Pressable>
        <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>Order Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <Animated.View entering={FadeInDown.springify()}>
          <Surface style={[styles.statusCard, { backgroundColor: status === 'ready' ? c.primaryContainer : c.elevation.level2 }]} elevation={0}>
            <Text style={{ fontSize: 40 }}>{ORDER_STATUS_EMOJI[status]}</Text>
            <View style={{ marginLeft: spacing.md }}>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>#{order.order_number}</Text>
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant }}>{ORDER_STATUS_LABELS[status]}</Text>
              <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>{formatDate(order.created_at)}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* OTP verification */}
        {status === 'ready' && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
              <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.md }}>🔐 Verify Pickup OTP</Text>
              <TextInput
                label="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                mode="outlined"
                style={{ marginBottom: spacing.md }}
                outlineStyle={{ borderRadius: radius.md }}
              />
              <Button
                mode="contained"
                onPress={handleVerifyOtp}
                loading={verifying}
                disabled={verifying || otp.length < 6}
                style={{ borderRadius: radius.lg }}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontWeight: '700' }}
              >
                Verify OTP & Complete Order
              </Button>
            </Surface>
          </Animated.View>
        )}

        {/* Items */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
            <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.md }}>🍽️ Items</Text>
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text variant="bodyMedium" style={{ color: c.onSurface, flex: 1 }}>{item.name} × {item.quantity}</Text>
                <Text variant="bodyMedium" style={{ color: c.onSurface, fontWeight: '600' }}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
            <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: c.outlineVariant, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700' }}>Total</Text>
              <Text variant="titleSmall" style={{ color: c.primary, fontWeight: '700' }}>{formatCurrency(order.total_amount)}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Special instructions */}
        {order.special_instructions && (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.elevation.level2, marginTop: spacing.md }]} elevation={0}>
              <Text variant="labelMedium" style={{ color: c.onSurfaceVariant }}>📝 Special Instructions</Text>
              <Text variant="bodyMedium" style={{ color: c.onSurface, marginTop: 4 }}>{order.special_instructions}</Text>
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
  statusCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.base },
  card: { borderRadius: radius.xl, padding: spacing.base },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
});
