import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { Store } from '@/api/types';
import { formatOperatingHours } from '@/utils';
import { spacing, radius } from '@/theme';

interface Props {
  store: Store;
  onPress: () => void;
}

export default function StoreCard({ store, onPress }: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const c = theme.colors;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hours = formatOperatingHours(store.operating_hours);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 10 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
        android_ripple={{ color: c.primary + '20' }}
      >
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
          {/* Image */}
          <View style={styles.imageContainer}>
            {store.image_url ? (
              <Image source={{ uri: store.image_url }} style={styles.image} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[c.primary, c.primaryContainer]}
                style={[styles.image, styles.placeholder]}
              >
                <Text style={{ fontSize: 40 }}>🍽️</Text>
              </LinearGradient>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.45)']}
              style={styles.imageOverlay}
            />
            {/* Status indicator */}
            <View style={[styles.statusDot, { backgroundColor: store.is_active ? '#22C55E' : '#EF4444' }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.row}>
              <Text variant="titleMedium" style={{ color: c.onSurface, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {store.name}
              </Text>
              <View style={[styles.activeBadge, { backgroundColor: store.is_active ? c.primaryContainer : c.surfaceVariant }]}>
                <Text variant="labelSmall" style={{ color: store.is_active ? c.onPrimaryContainer : c.onSurfaceVariant, fontWeight: '600' }}>
                  {store.is_active ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {store.description && (
              <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginTop: 2 }} numberOfLines={2}>
                {store.description}
              </Text>
            )}

            <View style={styles.footer}>
              {hours ? (
                <View style={styles.hoursBadge}>
                  <Text style={{ fontSize: 12 }}>🕐</Text>
                  <Text variant="bodySmall" style={{ color: c.onSurfaceVariant, marginLeft: spacing.xs }}>
                    {hours}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.chevron, { backgroundColor: c.primaryContainer }]}>
                <Text style={{ color: c.primary, fontWeight: '700', fontSize: 16 }}>→</Text>
              </View>
            </View>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  imageContainer: { position: 'relative', height: 160 },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  statusDot: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'white' },
  content: { padding: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  hoursBadge: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
