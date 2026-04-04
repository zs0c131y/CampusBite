import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Pressable } from 'react-native';
import { Text, useTheme, Surface, Button, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { ordersApi } from '@/api/orders';
import { useCart } from '@/contexts/CartContext';
import type { StudentStackParamList } from '@/navigation/types';
import { formatCurrency, buildUpiLink } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'Checkout'>;

export default function CheckoutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { cart, total, clearCart } = useCart();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [session, setSession] = useState<{ order_number: string; payment_reference: string; upi_id: string; total_amount: number; store_name: string } | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'done'>('review');
  const c = theme.colors;

  const handleCreateSession = async () => {
    if (!cart.storeId || cart.items.length === 0) return;
    setCreatingSession(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data } = await ordersApi.checkoutSession(
        cart.storeId,
        cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      );
      if (data.success) {
        setSession(data.data);
        setStep('payment');
      }
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to create checkout session.');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleOpenUpi = () => {
    if (!session) return;
    const upiUrl = buildUpiLink({
      upiId: session.upi_id,
      payee: session.store_name,
      amount: session.total_amount,
      transactionNote: `CampusBite order ${session.order_number}`,
      transactionRef: session.payment_reference,
    });
    Linking.openURL(upiUrl).catch(() =>
      alert('No UPI app found. Please pay manually and enter transaction ID.'),
    );
  };

  const handlePlaceOrder = async () => {
    if (!session || !cart.storeId) return;
    setPlacingOrder(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { data } = await ordersApi.create({
        store_id: cart.storeId,
        items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        payment_reference: session.payment_reference,
        total_amount: session.total_amount,
        special_instructions: specialInstructions || undefined,
        transaction_id: transactionId || undefined,
      });
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        setStep('done');
        setTimeout(() => {
          navigation.replace('OrderTracking', { orderId: data.data._id });
        }, 1500);
      }
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (step === 'done') {
    return (
      <View style={[styles.successContainer, { backgroundColor: c.background }]}>
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 80 }}>🎉</Text>
          <Text variant="headlineMedium" style={{ color: c.onSurface, fontWeight: '700', marginTop: spacing.md }}>Order Placed!</Text>
          <Text variant="bodyLarge" style={{ color: c.onSurfaceVariant, marginTop: 8 }}>Redirecting to tracker…</Text>
          <ActivityIndicator color={c.primary} style={{ marginTop: spacing.xl }} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: c.primary }}>← Back</Text>
        </Pressable>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
            <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700', marginBottom: spacing.md }}>
              🧾 Order Summary
            </Text>
            {cart.items.map((item) => (
              <View key={item.menuItemId} style={styles.orderItem}>
                <Text variant="bodyMedium" style={{ color: c.onSurface, flex: 1 }}>
                  {item.name} × {item.quantity}
                </Text>
                <Text variant="bodyMedium" style={{ color: c.onSurface, fontWeight: '600' }}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            <Divider style={{ marginVertical: spacing.md }} />
            <View style={styles.totalRow}>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>Total</Text>
              <Text variant="titleMedium" style={{ color: c.primary, fontWeight: '700' }}>{formatCurrency(total)}</Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Special instructions */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginTop: spacing.md }}>
          <TextInput
            label="Special instructions (optional)"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            mode="outlined"
            multiline
            numberOfLines={2}
            placeholder="e.g. Less spicy, no onions…"
            outlineStyle={{ borderRadius: radius.md }}
            left={<TextInput.Icon icon="note-text-outline" />}
          />
        </Animated.View>

        {/* Payment step */}
        {step === 'payment' && session && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginTop: spacing.md }}>
            <Surface style={[styles.card, { backgroundColor: c.primaryContainer }]} elevation={0}>
              <Text variant="titleMedium" style={{ color: c.onPrimaryContainer, fontWeight: '700', marginBottom: spacing.sm }}>
                💳 Payment via UPI
              </Text>
              <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer, marginBottom: spacing.md }}>
                Pay {formatCurrency(session.total_amount)} to {session.store_name}
              </Text>
              <Button
                mode="contained"
                onPress={handleOpenUpi}
                icon="qrcode-scan"
                style={{ borderRadius: radius.lg, marginBottom: spacing.md }}
                buttonColor={c.primary}
              >
                Open UPI App
              </Button>
              <TextInput
                label="Transaction ID (optional)"
                value={transactionId}
                onChangeText={setTransactionId}
                mode="outlined"
                placeholder="From your payment app"
                outlineStyle={{ borderRadius: radius.md }}
                left={<TextInput.Icon icon="receipt" />}
                style={{ backgroundColor: c.surface }}
              />
            </Surface>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: c.surface }]}>
        {step === 'review' ? (
          <Button
            mode="contained"
            onPress={handleCreateSession}
            loading={creatingSession}
            disabled={creatingSession}
            style={styles.actionBtn}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
            icon="arrow-right"
          >
            Proceed to Payment
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handlePlaceOrder}
            loading={placingOrder}
            disabled={placingOrder}
            style={styles.actionBtn}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
            icon="check-circle"
          >
            Confirm Order
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  card: { borderRadius: radius.xl, padding: spacing.base },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { padding: spacing.base, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  actionBtn: { borderRadius: radius.lg },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
