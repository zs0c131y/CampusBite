import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { useCart } from '@/contexts/CartContext';
import { SERVER_URL } from '@/api/client';
import type { CartItem } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'Cart'>;

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_URL}${url}`;
}

function CartItemRow({ item }: { item: CartItem }) {
  const theme = useTheme();
  const { updateQty } = useCart();
  const c = theme.colors;
  const imageUri = resolveImageUrl(item.image_url);

  return (
    <Animated.View
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify()}
    >
      <Surface style={[styles.cartItem, { borderColor: c.outlineVariant }]} elevation={0}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.itemImage} contentFit="cover" />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: c.surfaceVariant }]}>
            <MaterialCommunityIcons name="food" size={24} color={c.onSurfaceVariant} />
          </View>
        )}

        <View style={styles.itemText}>
          <Text style={[styles.itemName, { color: c.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemUnit, { color: c.onSurfaceVariant }]}>
            {formatCurrency(item.price)} each
          </Text>
          <Text style={[styles.itemTotal, { color: c.primary }]}>
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>

        {/* M3 stepper pill — matches MenuItemCard */}
        <View style={[styles.stepper, { backgroundColor: c.primaryContainer }]}>
          <Pressable
            hitSlop={8}
            style={styles.stepperBtn}
            onPress={() => { updateQty(item.menuItemId, item.quantity - 1); Haptics.selectionAsync(); }}
          >
            <MaterialCommunityIcons name="minus" size={15} color={c.onPrimaryContainer} />
          </Pressable>
          <Text style={[styles.stepperQty, { color: c.onPrimaryContainer }]}>{item.quantity}</Text>
          <Pressable
            hitSlop={8}
            style={styles.stepperBtn}
            onPress={() => { updateQty(item.menuItemId, item.quantity + 1); Haptics.selectionAsync(); }}
          >
            <MaterialCommunityIcons name="plus" size={15} color={c.onPrimaryContainer} />
          </Pressable>
        </View>
      </Surface>
    </Animated.View>
  );
}

export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { cart, itemCount, total, clearCart } = useCart();
  const c = theme.colors;

  if (itemCount === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Back button */}
        <View style={[styles.backBtnWrap, { top: insets.top + 8 }]}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: c.surfaceVariant }]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={c.onSurfaceVariant} />
          </Pressable>
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryContainer }]}>
            <MaterialCommunityIcons name="cart-outline" size={48} color={c.onPrimaryContainer} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.onSurface }]}>Your cart is empty</Text>
          <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>
            Head to the stores and pick something delicious!
          </Text>
          <Button
            mode="contained"
            onPress={() => (navigation as any).navigate('HomeTab')}
            style={styles.emptyBtn}
            contentStyle={{ height: 52 }}
            labelStyle={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
          >
            Browse Stores
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style="dark" />
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: c.elevation.level2 }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: c.surfaceVariant }]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={c.onSurfaceVariant} />
        </Pressable>

        <Text style={[styles.topBarTitle, { color: c.onSurface }]}>Cart</Text>

        <Pressable
          style={[styles.clearBtn, { backgroundColor: c.errorContainer }]}
          onPress={() => { clearCart(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }}
          hitSlop={8}
        >
          <Text style={[styles.clearText, { color: c.onErrorContainer }]}>Clear all</Text>
        </Pressable>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.menuItemId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 240, gap: spacing.sm }}
        ListHeaderComponent={
          /* Store pill */
          <View style={[styles.storePill, { backgroundColor: c.elevation.level2 }]}>
            <MaterialCommunityIcons name="store-outline" size={16} color={c.primary} />
            <Text style={[styles.storeName, { color: c.onSurface }]} numberOfLines={1}>
              {cart.storeName}
            </Text>
          </View>
        }
        renderItem={({ item }) => <CartItemRow item={item} />}
      />

      {/* Bottom summary */}
      <View style={[styles.summary, { backgroundColor: c.elevation.level2, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: c.onSurfaceVariant }]}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.summaryValue, { color: c.onSurface }]}>{formatCurrency(total)}</Text>
        </View>

        <Divider style={{ marginVertical: spacing.sm, backgroundColor: c.outlineVariant }} />

        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: c.onSurface }]}>Total</Text>
          <Text style={[styles.totalValue, { color: c.primary }]}>{formatCurrency(total)}</Text>
        </View>

        <Button
          mode="contained"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Checkout'); }}
          style={styles.checkoutBtn}
          contentStyle={{ height: 56 }}
          labelStyle={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: 0.2 }}
          icon="arrow-right"
        >
          Proceed to Checkout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  backBtnWrap: { position: 'absolute', left: spacing.base, zIndex: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  clearText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  storeName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemImage: { width: 64, height: 64, borderRadius: radius.lg },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
  itemUnit: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  itemTotal: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 4 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 2,
  },
  stepperBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepperQty: { fontSize: 14, fontFamily: 'Inter_700Bold', minWidth: 20, textAlign: 'center' },

  summary: {
    padding: spacing.base,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  summaryValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },

  checkoutBtn: { borderRadius: radius.lg, marginTop: spacing.md },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingTop: 64 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginBottom: spacing.sm },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: spacing.xl, borderRadius: radius.lg },
});
