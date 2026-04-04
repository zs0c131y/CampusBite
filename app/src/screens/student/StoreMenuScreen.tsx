import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, useTheme, Surface, Chip, ActivityIndicator, FAB, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { storesApi } from '@/api/stores';
import { useCart } from '@/contexts/CartContext';
import type { MenuItem, Store } from '@/api/types';
import type { StoreMenuScreenProps } from '@/navigation/types';
import { formatCurrency } from '@/utils';
import MenuItemCard from '@/components/MenuItemCard';
import { spacing, radius } from '@/theme';

export default function StoreMenuScreen({ route, navigation }: StoreMenuScreenProps) {
  const { storeId, storeName } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, itemCount, cart, isDifferentStore } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const fabScale = useSharedValue(1);

  const fetchMenu = useCallback(async () => {
    try {
      const [storeRes, menuRes] = await Promise.allSettled([
        storesApi.get(storeId),
        storesApi.menu(storeId),
      ]);
      if (storeRes.status === 'fulfilled' && storeRes.value.data.success) {
        setStore(storeRes.value.data.data);
      }
      if (menuRes.status === 'fulfilled' && menuRes.value.data.success) {
        const items = menuRes.value.data.data?.menu ?? [];
        setMenu(items);
        const cats = Array.from(new Set(items.map((i: MenuItem) => i.category).filter(Boolean))) as string[];
        setCategories(cats);
      }
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const filteredMenu = selectedCategory
    ? menu.filter((i) => i.category === selectedCategory)
    : menu;

  const handleAdd = async (item: MenuItem) => {
    if (isDifferentStore(storeId)) {
      Alert.alert(
        'Start new cart? 🛒',
        `Your cart has items from "${cart.storeName}". Adding this will clear it.`,
        [
          { text: 'Keep current', style: 'cancel' },
          {
            text: 'Start fresh',
            style: 'destructive',
            onPress: () => doAdd(item),
          },
        ],
      );
      return;
    }
    doAdd(item);
  };

  const doAdd = async (item: MenuItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({
      menuItemId: item._id,
      storeId,
      storeName,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    });
    setSnackMsg(`${item.name} added to cart 🛒`);
    setSnackVisible(true);
    // FAB bounce
    fabScale.value = withSpring(1.2, { damping: 4 }, () => {
      fabScale.value = withSpring(1);
    });
  };

  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const c = theme.colors;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={filteredMenu.filter((i) => i.is_available)}
        keyExtractor={(i) => i._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <>
            {/* Store image header */}
            <View style={styles.imageHeader}>
              {store?.image_url ? (
                <Image source={{ uri: store.image_url }} style={styles.storeImage} contentFit="cover" />
              ) : (
                <LinearGradient colors={[c.primary, c.primaryContainer]} style={styles.storeImage}>
                  <Text style={{ fontSize: 56 }}>🍽️</Text>
                </LinearGradient>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
              {/* Back button */}
              <Pressable
                onPress={() => navigation.goBack()}
                style={[styles.backBtn, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.4)' }]}
              >
                <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
              </Pressable>
              <View style={styles.storeInfo}>
                <Text variant="headlineSmall" style={{ color: '#fff', fontWeight: '700' }}>
                  {storeName}
                </Text>
                {store?.operating_hours && (
                  <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                    🕐 {typeof store.operating_hours === 'string'
                      ? store.operating_hours
                      : `${(store.operating_hours as any).open ?? (store.operating_hours as any).opening_time ?? ''} – ${(store.operating_hours as any).close ?? (store.operating_hours as any).closing_time ?? ''}`
                    }
                  </Text>
                )}
              </View>
            </View>

            {/* Category chips */}
            {categories.length > 0 && (
              <View style={styles.chipsContainer}>
                <Chip
                  selected={selectedCategory === null}
                  onPress={() => { setSelectedCategory(null); Haptics.selectionAsync(); }}
                  style={styles.chip}
                  showSelectedOverlay
                >
                  All
                </Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    selected={selectedCategory === cat}
                    onPress={() => { setSelectedCategory(cat === selectedCategory ? null : cat); Haptics.selectionAsync(); }}
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {cat}
                  </Chip>
                ))}
              </View>
            )}

            <Text variant="titleMedium" style={[styles.menuTitle, { color: c.onSurface }]}>
              🍴 Menu ({filteredMenu.filter((i) => i.is_available).length} items)
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🫙</Text>
            <Text variant="titleMedium" style={{ color: c.onSurface, marginTop: spacing.md }}>
              No items available
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}
          >
            <MenuItemCard item={item} onAdd={() => handleAdd(item)} />
          </Animated.View>
        )}
      />

      {/* Cart FAB */}
      {itemCount > 0 && (
        <Animated.View style={[styles.fabContainer, { bottom: insets.bottom + 16 }, fabStyle]}>
          <FAB
            label={`View Cart  •  ${itemCount} item${itemCount > 1 ? 's' : ''}`}
            icon="cart"
            onPress={() => navigation.navigate('Cart')}
            style={{ backgroundColor: c.primary }}
            color={c.onPrimary}
          />
        </Animated.View>
      )}

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={1800}
        style={{ backgroundColor: c.inverseSurface }}
      >
        <Text style={{ color: c.inverseOnSurface }}>{snackMsg}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageHeader: { height: 220, justifyContent: 'flex-end', overflow: 'hidden', alignItems: 'center' },
  storeImage: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: spacing.base, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { padding: spacing.base, width: '100%' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.base },
  chip: { marginRight: 0 },
  menuTitle: { fontWeight: '700', paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  fabContainer: { position: 'absolute', alignSelf: 'center' },
  empty: { alignItems: 'center', paddingTop: 48 },
});
