import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { MenuItem } from '@/api/types';
import { SERVER_URL } from '@/api/client';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_URL}${url}`;
}

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

  return (
    <Surface style={[styles.card, { backgroundColor: c.surface, opacity: item.is_available ? 1 : 0.45 }]} elevation={0}>
      <View style={[styles.inner, { borderColor: c.outlineVariant }]}>
        {/* Left: text */}
        <View style={styles.textCol}>
          <Text style={[styles.name, { color: c.onSurface }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={[styles.desc, { color: c.onSurfaceVariant }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.price, { color: c.primary }]}>
            {formatCurrency(item.price)}
          </Text>
        </View>

        {/* Right: image + stepper */}
        <View style={styles.rightCol}>
          {imageUri && !imgError ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: c.surfaceVariant }]}>
              <MaterialCommunityIcons name="food" size={28} color={c.onSurfaceVariant} />
            </View>
          )}

          {quantity === 0 ? (
            <Pressable
              style={[styles.addBtn, { backgroundColor: c.primaryContainer }]}
              onPress={onAdd}
              disabled={!item.is_available}
              android_ripple={{ color: c.primary + '30', borderless: false }}
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
  price: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: spacing.sm },

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
