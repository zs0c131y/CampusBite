import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Pressable, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Surface, Button, TextInput, ActivityIndicator, Snackbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const c = theme.colors;

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const showError = (msg: string) => setErrorMsg(msg);

  const [session, setSession] = useState<{
    checkoutToken: string;
    upiId: string;
    totalAmount: number;
    storeName: string;
    paymentReference: string;
  } | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'done'>('review');

  const handleCreateSession = async () => {
    if (!cart.storeId || cart.items.length === 0) return;
    setCreatingSession(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data } = await ordersApi.checkoutSession(
        cart.storeId,
        cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        specialInstructions.trim() || undefined,
      );
      if (data.success) {
        const s = data.data;
        setSession({
          checkoutToken: s.checkoutToken,
          upiId: s.store.upiId,
          totalAmount: s.totalAmount,
          storeName: s.store.name,
          paymentReference: s.paymentReference,
        });
        setStep('payment');
      }
    } catch (e: any) {
      showError(e.response?.data?.message ?? 'Failed to create checkout session.');
    } finally { setCreatingSession(false); }
  };

  const handleOpenUpi = () => {
    if (!session) return;
    const upiUrl = buildUpiLink({
      upiId: session.upiId,
      payee: session.storeName,
      amount: session.totalAmount,
      transactionNote: `CampusBite order`,
      transactionRef: session.paymentReference,
    });
    Linking.openURL(upiUrl).catch(() =>
      showError('No UPI app found. Please pay manually and enter the transaction ID.'),
    );
  };

  const handlePlaceOrder = async () => {
    if (!session || !cart.storeId) return;
    setPlacingOrder(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { data } = await ordersApi.create({
        checkoutToken: session.checkoutToken,
        transaction_id: transactionId.trim() || undefined,
      });
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        setStep('done');
        setTimeout(() => navigation.replace('OrderTracking', { orderId: data.data._id }), 1500);
      }
    } catch (e: any) {
      showError(e.response?.data?.message ?? 'Failed to place order.');
    } finally { setPlacingOrder(false); }
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // ── Success screen ────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <View style={[styles.successScreen, { backgroundColor: c.background }]}>
        <View style={[styles.successRing, { borderColor: c.primaryContainer }]}>
          <LinearGradient colors={[c.primary, c.secondary ?? c.primaryContainer]} style={styles.successCircle}>
            <MaterialCommunityIcons name="check-bold" size={52} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={[styles.successTitle, { color: c.onSurface }]}>Order Placed!</Text>
        <Text style={[styles.successSub, { color: c.onSurfaceVariant }]}>
          Hang tight — we're taking you to your tracker.
        </Text>
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style="light" />

      {/* ── Big gradient hero header ─────────────────────────────────────── */}
      <LinearGradient
        colors={[c.primary, '#7A3C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        {/* Back */}
        <Pressable
          style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>

        {/* Total amount — the hero moment */}
        <View style={styles.heroBody}>
          <Text style={styles.heroLabel}>
            {step === 'review' ? 'Review your order' : 'Complete payment'}
          </Text>
          <Text style={styles.heroAmount}>{formatCurrency(total ?? 0)}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <MaterialCommunityIcons name="store-outline" size={13} color="#fff" />
              <Text style={styles.heroPillText}>{cart.storeName}</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <MaterialCommunityIcons name="shopping-outline" size={13} color="#fff" />
              <Text style={styles.heroPillText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Step dots */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: '#fff' }]} />
          <View style={[styles.stepConnector, { backgroundColor: step === 'payment' ? '#fff' : 'rgba(255,255,255,0.35)' }]} />
          <View style={[styles.stepDot, { backgroundColor: step === 'payment' ? '#fff' : 'rgba(255,255,255,0.35)' }]} />
          <Text style={styles.stepHint}>
            {step === 'review' ? 'Step 1 of 2 — Review' : 'Step 2 of 2 — Payment'}
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 100, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Receipt card ────────────────────────────────────────────────── */}
        <Surface style={[styles.card, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.outlineVariant }]} elevation={0}>
          {/* Card title */}
          <View style={styles.receiptHeader}>
            <MaterialCommunityIcons name="text-box-check-outline" size={20} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.onSurface }]}>Your Order</Text>
          </View>

          {/* Items */}
          {cart.items.map((item, idx) => (
            <View key={item.menuItemId}>
              {idx > 0 && (
                <View style={[styles.dashedLine, { borderColor: c.outlineVariant }]} />
              )}
              <View style={styles.receiptRow}>
                <View style={[styles.qtyCircle, { backgroundColor: c.primaryContainer }]}>
                  <Text style={[styles.qtyCircleText, { color: c.primary }]}>{item.quantity}</Text>
                </View>
                <View style={styles.receiptItemText}>
                  <Text style={[styles.receiptItemName, { color: c.onSurface }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.receiptItemUnit, { color: c.onSurfaceVariant }]}>
                    {formatCurrency(item.price ?? 0)} each
                  </Text>
                </View>
                <Text style={[styles.receiptItemTotal, { color: c.onSurface }]}>
                  {formatCurrency((item.price ?? 0) * item.quantity)}
                </Text>
              </View>
            </View>
          ))}

          {/* Total row */}
          <LinearGradient
            colors={[c.primaryContainer + '80', c.primaryContainer]}
            style={styles.receiptTotal}
          >
            <Text style={[styles.receiptTotalLabel, { color: c.onPrimaryContainer }]}>Total to pay</Text>
            <Text style={[styles.receiptTotalValue, { color: c.primary }]}>{formatCurrency(total ?? 0)}</Text>
          </LinearGradient>
        </Surface>

        {/* ── Special instructions ─────────────────────────────────────────── */}
        <Surface style={[styles.card, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.outlineVariant }]} elevation={0}>
          <View style={styles.receiptHeader}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.onSurface }]}>Special Instructions</Text>
            <View style={[styles.optionalPill, { backgroundColor: c.surfaceVariant }]}>
              <Text style={[styles.optionalText, { color: c.onSurfaceVariant }]}>optional</Text>
            </View>
          </View>
          <View style={[styles.instrWrap, { borderColor: c.outlineVariant }]}>
            {!specialInstructions && (
              <Text style={[styles.instrPlaceholder, { color: c.onSurfaceVariant }]} pointerEvents="none">
                e.g. Less spicy, no onions, extra sauce…
              </Text>
            )}
            <RNTextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.instrInput, { color: c.onSurface }]}
            />
          </View>
        </Surface>

        {/* ── Payment section (step 2) ─────────────────────────────────────── */}
        {step === 'payment' && session && (
          <>
            {/* Payment card — feels like a debit card */}
            <LinearGradient
              colors={[c.primary, c.secondary ?? '#8B4513']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.payCard}
            >
              {/* Decorative circles */}
              <View style={styles.payCardCircle1} />
              <View style={styles.payCardCircle2} />

              <View style={styles.payCardTop}>
                <MaterialCommunityIcons name="contactless-payment" size={32} color="rgba(255,255,255,0.9)" />
                <Text style={styles.payCardChip}>UPI</Text>
              </View>

              <Text style={styles.payCardAmount}>{formatCurrency(session.totalAmount)}</Text>
              <Text style={styles.payCardStore}>{session.storeName}</Text>

              <View style={[styles.payCardDivider, { borderColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={styles.payCardFooter}>
                <View>
                  <Text style={styles.payCardFooterLabel}>Ref No.</Text>
                  <Text style={styles.payCardFooterValue}>{session.paymentReference}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.payCardFooterLabel}>UPI ID</Text>
                  <Text style={styles.payCardFooterValue} numberOfLines={1}>{session.upiId}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* How to pay guide */}
            <Surface style={[styles.card, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.outlineVariant }]} elevation={0}>
              <Text style={[styles.cardTitle, { color: c.onSurface, marginBottom: spacing.md }]}>
                How to pay
              </Text>
              {[
                { icon: 'open-in-app', label: 'Open your UPI app below' },
                { icon: 'currency-inr', label: `Pay ${formatCurrency(session.totalAmount)} to ${session.storeName}` },
                { icon: 'receipt-text-outline', label: 'Copy the transaction ID from your app' },
                { icon: 'check-circle-outline', label: 'Paste it below and confirm your order' },
              ].map((step, i) => (
                <View key={i} style={styles.guideRow}>
                  <View style={[styles.guideNum, { backgroundColor: i < 1 ? c.primaryContainer : c.surfaceVariant }]}>
                    <Text style={[styles.guideNumText, { color: i < 1 ? c.primary : c.onSurfaceVariant }]}>{i + 1}</Text>
                  </View>
                  <MaterialCommunityIcons name={step.icon as any} size={18} color={c.primary} style={{ marginRight: spacing.sm }} />
                  <Text style={[styles.guideText, { color: c.onSurface }]} numberOfLines={2}>{step.label}</Text>
                </View>
              ))}

              <Button
                mode="contained"
                onPress={handleOpenUpi}
                icon="open-in-app"
                style={{ borderRadius: radius.lg, marginTop: spacing.base }}
                contentStyle={{ height: 50 }}
                labelStyle={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
              >
                Open UPI App
              </Button>
            </Surface>

            {/* Transaction ID */}
            <Surface style={[styles.card, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.outlineVariant }]} elevation={0}>
              <View style={styles.receiptHeader}>
                <MaterialCommunityIcons name="receipt-text-outline" size={20} color={c.primary} />
                <Text style={[styles.cardTitle, { color: c.onSurface }]}>Transaction ID</Text>
                <View style={[styles.optionalPill, { backgroundColor: c.surfaceVariant }]}>
                  <Text style={[styles.optionalText, { color: c.onSurfaceVariant }]}>optional</Text>
                </View>
              </View>
              <TextInput
                value={transactionId}
                onChangeText={setTransactionId}
                mode="outlined"
                placeholder="Paste from your payment app"
                outlineStyle={{ borderRadius: radius.md }}
                outlineColor={c.outlineVariant}
                style={{ marginTop: spacing.sm }}
              />
            </Surface>
          </>
        )}
      </ScrollView>

      {/* ── Sticky CTA ───────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: c.elevation.level2 }]}>
        {step === 'review' ? (
          <Button
            mode="contained"
            onPress={handleCreateSession}
            loading={creatingSession}
            disabled={creatingSession}
            style={styles.cta}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 0.2 }}
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
            style={styles.cta}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 0.2 }}
            icon="check-circle-outline"
          >
            Confirm Order
          </Button>
        )}
      </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg('')}
        duration={4000}
        style={{ backgroundColor: c.errorContainer, marginBottom: insets.bottom + 80 }}
        action={{ label: 'Dismiss', onPress: () => setErrorMsg(''), labelStyle: { color: c.error } }}
      >
        <Text style={{ color: c.onErrorContainer, fontFamily: 'Inter_400Regular' }}>{errorMsg}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Hero ──
  hero: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.base,
  },
  heroBody: { marginBottom: spacing.lg },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  heroAmount: { color: '#fff', fontSize: 48, fontFamily: 'Inter_700Bold', letterSpacing: -2, lineHeight: 52 },
  heroMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  heroPillText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_500Medium' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepConnector: { width: 24, height: 2, borderRadius: 1 },
  stepHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: 4 },

  // ── Cards ──
  card: { borderRadius: radius.xl, padding: spacing.base },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },

  // ── Receipt items ──
  dashedLine: { borderWidth: 0, borderTopWidth: 1, borderStyle: 'dashed', marginVertical: spacing.xs },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  qtyCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qtyCircleText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  receiptItemText: { flex: 1 },
  receiptItemName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  receiptItemUnit: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  receiptItemTotal: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  receiptTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, borderRadius: radius.lg,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  receiptTotalLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  receiptTotalValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },

  // ── Special instructions ──
  instrWrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    minHeight: 90,
  },
  instrPlaceholder: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  instrInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 66,
    padding: 0,
  },
  optionalPill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  optionalText: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  // ── Payment card ──
  payCard: { borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden', minHeight: 180 },
  payCardCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 },
  payCardCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)', bottom: -30, left: 20 },
  payCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.base },
  payCardChip: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  payCardAmount: { color: '#fff', fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: -1.5 },
  payCardStore: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  payCardDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  payCardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  payCardFooterLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  payCardFooterValue: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold', maxWidth: 140 },

  // ── How to pay guide ──
  guideRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  guideNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  guideNumText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  guideText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  // ── Footer ──
  footer: { padding: spacing.base, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  cta: { borderRadius: radius.lg },

  // ── Success ──
  successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl },
  successRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
