import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { MenuItem } from '@/api/types';
import { resolveImageUrl, withOpacity, formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

interface Props {
  item: MenuItem;
  onAdd: () => void;
  onRemove?: () => void;
  quantity?: number;
}

export default function MenuItemCard({ item, onAdd, onRemove, quantity = 0 }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const [imgError, setImgError] = useState(false);
  const imageUri = resolveImageUrl(item.image_url);
  const unavailable = !item.is_available;

  return (
    <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
      <View style={[styles.inner, { borderColor: c.outlineVariant }]}>
        <View style={styles.textCol}>
          <Text
            style={[styles.name, { color: unavailable ? c.onSurfaceVariant : c.onSurface }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.description ? (
            <Text
              style={[styles.desc, { color: c.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: unavailable ? c.onSurfaceVariant : c.primary }]}>
              {formatCurrency(item.price)}
            </Text>
            {unavailable && (
              <View style={[styles.soldOutBadge, { backgroundColor: c.errorContainer }]}>
                <Text style={[styles.soldOutText, { color: c.onErrorContainer }]}>Sold out</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightCol}>
          {imageUri && !imgError ? (
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, unavailable && { opacity: 0.5 }]}
              contentFit="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: c.surfaceVariant }]}>
              <MaterialCommunityIcons name="food" size={28} color={c.onSurfaceVariant} />
            </View>
          )}

          {!unavailable && (
            quantity === 0 ? (
              <Pressable
                style={[styles.addBtn, { backgroundColor: c.primaryContainer }]}
                onPress={onAdd}
                android_ripple={{ color: withOpacity(c.primary, 0.19), borderless: false }}
              >
                <Text style={[styles.addBtnText, { color: c.onPrimaryContainer }]}>Add</Text>
              </Pressable>
            ) : (
              <View style={[styles.stepper, { backgroundColor: c.primaryContainer }]}>
                <Pressable onPress={onRemove} hitSlop={8} style={styles.stepperBtn}>
                  <MaterialCommunityIcons name="minus" size={15} color={c.onPrimaryContainer} />
                </Pressable>
                <Text style={[styles.stepperQty, { color: c.onPrimaryContainer }]}>{quantity}</Text>
                <Pressable onPress={onAdd} hitSlop={8} style={styles.stepperBtn}>
                  <MaterialCommunityIcons name="plus" size={15} color={c.onPrimaryContainer} />
                </Pressable>
              </View>
            )
          )}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  inner: {
    flexDirection: 'row',
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  textCol: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  price: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  soldOutBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  soldOutText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  rightCol: { alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  image: { width: 88, height: 88, borderRadius: radius.lg },
  imageFallback: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addBtn: {
    width: 88,
    paddingVertical: 7,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  stepper: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  stepperBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepperQty: { fontSize: 14, fontFamily: 'Inter_700Bold', minWidth: 18, textAlign: 'center' },
});