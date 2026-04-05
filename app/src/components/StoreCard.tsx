import React, { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { Store } from '@/api/types';
import { SERVER_URL } from '@/api/client';
import { formatOperatingHours } from '@/utils';
import { spacing, radius } from '@/theme';

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_URL}${url}`;
}

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
  const imageUri = resolveImageUrl(store.image_url);
  const [imgError, setImgError] = useState(false);

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
            {imageUri && !imgError ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
                onError={() => setImgError(true)}
              />
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
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.row}>
              <Text style={[styles.storeName, { color: c.onSurface, flex: 1 }]} numberOfLines={1}>
                {store.name}
              </Text>
              <View style={[styles.activeBadge, { backgroundColor: store.is_active ? c.primaryContainer : c.surfaceVariant }]}>
                <Text style={[styles.badgeText, { color: store.is_active ? c.onPrimaryContainer : c.onSurfaceVariant }]}>
                  {store.is_active ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {store.description && (
              <Text style={[styles.storeDesc, { color: c.onSurfaceVariant }]} numberOfLines={2}>
                {store.description}
              </Text>
            )}

            <View style={styles.footer}>
              {hours ? (
                <View style={styles.hoursBadge}>
                  <Text style={{ fontSize: 12 }}>🕐</Text>
                  <Text style={[styles.hoursText, { color: c.onSurfaceVariant }]}>
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
  content: { padding: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  storeDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  activeBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  hoursBadge: { flexDirection: 'row', alignItems: 'center' },
  hoursText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: spacing.xs },
  chevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
