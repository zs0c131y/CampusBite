import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, Button, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'Cart'>;

function CartItemRow({ item }: { item: CartItem }) {
  const theme = useTheme();
  const { updateQty, removeItem } = useCart();
  const c = theme.colors;

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutUp.duration(200)}
      layout={LinearTransition.springify()}
      style={[styles.cartItem, { backgroundColor: c.surface }]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: c.primaryContainer }]}>
          <Text style={{ fontSize: 24 }}>🍽️</Text>
        </View>
      )}

      <View style={{ flex: 1, marginHorizontal: spacing.md }}>
        <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '600' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="bodyMedium" style={{ color: c.primary, fontWeight: '700', marginTop: 2 }}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
        <Text variant="bodySmall" style={{ color: c.onSurfaceVariant }}>
          {formatCurrency(item.price)} × {item.quantity}
        </Text>
      </View>

      {/* Qty controls */}
      <View style={styles.qtyRow}>
        <Pressable
          style={[styles.qtyBtn, { backgroundColor: c.surfaceVariant }]}
          onPress={() => { updateQty(item.menuItemId, item.quantity - 1); Haptics.selectionAsync(); }}
        >
          <Text style={{ color: c.onSurfaceVariant, fontWeight: '700', fontSize: 18 }}>−</Text>
        </Pressable>
        <Text variant="titleSmall" style={{ color: c.onSurface, minWidth: 24, textAlign: 'center', fontWeight: '700' }}>
          {item.quantity}
        </Text>
        <Pressable
          style={[styles.qtyBtn, { backgroundColor: c.primary }]}
          onPress={() => { updateQty(item.menuItemId, item.quantity + 1); Haptics.selectionAsync(); }}
        >
          <Text style={{ color: c.onPrimary, fontWeight: '700', fontSize: 18 }}>+</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

import { Pressable } from 'react-native';

export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { cart, itemCount, total, clearCart } = useCart();
  const c = theme.colors;

  if (itemCount === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text variant="headlineSmall" style={{ color: c.onSurface, fontWeight: '700' }}>
            Your cart is empty
          </Text>
          <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
            Head to the stores and pick something delicious!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: spacing.xl, borderRadius: radius.lg }}
            contentStyle={{ height: 48 }}
          >
            Browse Stores 🍽️
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: c.primary, fontSize: 16 }}>← Back</Text>
        </Pressable>
        <Text variant="titleLarge" style={{ color: c.onSurface, fontWeight: '700' }}>
          Your Cart 🛒
        </Text>
        <Pressable onPress={() => { clearCart(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }}>
          <Text style={{ color: c.error, fontSize: 14 }}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.menuItemId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 200 }}
        ListHeaderComponent={
          <View style={[styles.storeBanner, { backgroundColor: c.primaryContainer }]}>
            <Text style={{ fontSize: 20 }}>🏪</Text>
            <Text variant="labelLarge" style={{ color: c.onPrimaryContainer, fontWeight: '700' }}>
              {cart.storeName}
            </Text>
          </View>
        }
        renderItem={({ item }) => <CartItemRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      {/* Bottom summary */}
      <View style={[styles.summary, { backgroundColor: c.surface, paddingBottom: insets.bottom + 16 }]}>
        <Surface style={[styles.summaryCard, { backgroundColor: c.elevation.level1 }]} elevation={0}>
          <View style={styles.summaryRow}>
            <Text variant="bodyLarge" style={{ color: c.onSurfaceVariant }}>Subtotal</Text>
            <Text variant="bodyLarge" style={{ color: c.onSurface }}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyLarge" style={{ color: c.onSurfaceVariant }}>Items</Text>
            <Text variant="bodyLarge" style={{ color: c.onSurface }}>{itemCount}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700' }}>Total</Text>
            <Text variant="titleMedium" style={{ color: c.primary, fontWeight: '700' }}>{formatCurrency(total)}</Text>
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Checkout'); }}
          style={[styles.checkoutBtn, { marginTop: spacing.md }]}
          contentStyle={{ height: 56 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  storeBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cartItem: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md },
  itemImage: { width: 60, height: 60, borderRadius: radius.md },
  itemImagePlaceholder: { width: 60, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summary: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.base, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  summaryCard: { borderRadius: radius.lg, padding: spacing.base },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  checkoutBtn: { borderRadius: radius.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl },
  emptyEmoji: { fontSize: 80, marginBottom: spacing.xl },
});
