import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface, Button, TextInput, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import type { OrderDetailScreenProps } from '@/navigation/types';
import { ORDER_STATUS_LABELS, formatCurrency, formatDate } from '@/utils';
import { spacing, radius } from '@/theme';

const STATUS_ICON: Record<OrderStatus, string> = {
  placed:     'clock-outline',
  accepted:   'check-circle-outline',
  processing: 'silverware-fork-knife',
  ready:      'bell-ring',
  picked_up:  'shopping-outline',
  cancelled:  'close-circle-outline',
};

export default function OrderDetailScreen({ route, navigation }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const c = theme.colors;

  useEffect(() => {
    ordersApi.get(orderId).then(({ data }) => {
      if (data.success) setOrder(data.data);
    });
  }, [orderId]);

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorDialog('Please enter the 6-digit OTP.');
      return;
    }
    setVerifying(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { data } = await ordersApi.verifyOtp(orderId, otp);
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessDialog(true);
      }
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorDialog(e.response?.data?.message ?? 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (!order) return null;
  const status = order.order_status as OrderStatus;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={c.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.onSurface }]}>Order Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <Animated.View entering={FadeInDown.springify()}>
          <Surface
            style={[styles.statusCard, {
              backgroundColor: status === 'ready' ? c.primaryContainer : c.elevation.level2,
            }]}
            elevation={0}
          >
            <View style={[styles.statusIcon, { backgroundColor: c.primary + '15' }]}>
              <MaterialCommunityIcons
                name={STATUS_ICON[status] as any}
                size={32}
                color={c.primary}
              />
            </View>
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={[styles.orderNumber, { color: c.onSurface }]}>#{order.order_number}</Text>
              <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                {ORDER_STATUS_LABELS[status]}
              </Text>
              <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 }}>
                {formatDate(order.created_at)}
              </Text>
            </View>
          </Surface>
        </Animated.View>

        {/* OTP verification */}
        {status === 'ready' && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={c.primary} />
                <Text style={[styles.cardTitle, { color: c.onSurface }]}>Verify Pickup OTP</Text>
              </View>
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
                labelStyle={{ fontFamily: 'Inter_700Bold' }}
                icon="check-circle-outline"
              >
                Verify &amp; Complete Order
              </Button>
            </Surface>
          </Animated.View>
        )}

        {/* Items */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Surface style={[styles.card, { backgroundColor: c.surface, marginTop: spacing.md }]} elevation={1}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="food-variant" size={18} color={c.primary} />
              <Text style={[styles.cardTitle, { color: c.onSurface }]}>Items</Text>
            </View>
            {order.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={{ color: c.onSurface, fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 }}>
                  {item.name} × {item.quantity}
                </Text>
                <Text style={{ color: c.onSurface, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
            <View style={[styles.itemRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.outlineVariant, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <Text style={{ color: c.onSurface, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Total</Text>
              <Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 15 }}>{formatCurrency(order.total_amount)}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Special instructions */}
        {order.special_instructions && (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.elevation.level2, marginTop: spacing.md }]} elevation={0}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={c.onSurfaceVariant} />
                <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                  Special Instructions
                </Text>
              </View>
              <Text style={{ color: c.onSurface, fontFamily: 'Inter_400Regular', fontSize: 14 }}>
                {order.special_instructions}
              </Text>
            </Surface>
          </Animated.View>
        )}
      </ScrollView>

      {/* Success dialog */}
      <Portal>
        <Dialog
          visible={successDialog}
          onDismiss={() => { setSuccessDialog(false); navigation.goBack(); }}
          style={{ borderRadius: radius.xl, backgroundColor: c.surface }}
        >
          <Dialog.Icon icon="check-circle" size={40} />
          <Dialog.Title style={{ textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
            Order Complete!
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              OTP verified. Order marked as picked up.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center' }}>
            <Button
              mode="contained"
              onPress={() => { setSuccessDialog(false); navigation.goBack(); }}
              style={{ borderRadius: radius.lg, paddingHorizontal: spacing.lg }}
              labelStyle={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!errorDialog}
          onDismiss={() => setErrorDialog(null)}
          style={{ borderRadius: radius.xl, backgroundColor: c.surface }}
        >
          <Dialog.Icon icon="alert-circle" size={40} />
          <Dialog.Title style={{ textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: c.onSurface }}>
            Error
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
              {errorDialog}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center' }}>
            <Button onPress={() => setErrorDialog(null)} labelStyle={{ fontFamily: 'Inter_500Medium' }}>
              Dismiss
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingBottom: spacing.md,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  statusCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.base },
  statusIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  orderNumber: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  card: { borderRadius: radius.xl, padding: spacing.base },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
});
