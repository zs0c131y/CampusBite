import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { MenuItem } from '@/api/types';
import { formatCurrency } from '@/utils';
import { spacing, radius } from '@/theme';

interface Props {
  item: MenuItem;
  onAdd: () => void;
  quantity?: number;
}

export default function MenuItemCard({ item, onAdd, quantity = 0 }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const btnScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleAdd = () => {
    btnScale.value = withSpring(0.85, { damping: 8 }, () => {
      btnScale.value = withSpring(1);
    });
    onAdd();
  };

  return (
    <Surface style={[styles.card, { backgroundColor: c.surface, opacity: item.is_available ? 1 : 0.5 }]} elevation={1}>
      <View style={styles.content}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text variant="titleSmall" style={{ color: c.onSurface, fontWeight: '700' }} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginTop: 2 }} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.category && (
            <View style={[styles.categoryChip, { backgroundColor: c.tertiaryContainer }]}>
              <Text variant="labelSmall" style={{ color: c.onTertiaryContainer, fontSize: 11 }}>{item.category}</Text>
            </View>
          )}
          <Text variant="titleSmall" style={{ color: c.primary, fontWeight: '700', marginTop: spacing.sm }}>
            {formatCurrency(item.price)}
          </Text>
        </View>

        <View style={styles.rightCol}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: c.primaryContainer }]}>
              <Text style={{ fontSize: 28 }}>🍽️</Text>
            </View>
          )}

          <Animated.View style={[styles.addBtn, btnStyle]}>
            <Pressable
              style={[styles.addBtnInner, {
                backgroundColor: quantity > 0 ? c.primary : c.primaryContainer,
              }]}
              onPress={handleAdd}
              disabled={!item.is_available}
            >
              <Text style={{ color: quantity > 0 ? c.onPrimary : c.onPrimaryContainer, fontWeight: '700', fontSize: 18 }}>
                {quantity > 0 ? `${quantity}` : '+'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  content: { flexDirection: 'row', padding: spacing.base },
  categoryChip: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.sm },
  rightCol: { alignItems: 'center' },
  image: { width: 80, height: 80, borderRadius: radius.lg },
  imagePlaceholder: { width: 80, height: 80, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  addBtn: { marginTop: spacing.sm },
  addBtnInner: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
