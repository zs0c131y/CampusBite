import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import { Text, useTheme, ActivityIndicator, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenBars } from '@/components/ScreenBars';

import { storesApi, resolveMenuItems } from '@/api/stores';
import { SERVER_URL } from '@/api/client';
import { useCart } from '@/contexts/CartContext';
import type { MenuItem, Store } from '@/api/types';
import type { StoreMenuScreenProps } from '@/navigation/types';
import { formatCurrency, formatOperatingHours } from '@/utils';
import MenuItemCard from '@/components/MenuItemCard';
import { spacing, radius } from '@/theme';

function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_URL}${url}`;
}

const HERO_HEIGHT = 260;

export default function StoreMenuScreen({ route, navigation }: StoreMenuScreenProps) {
  const { storeId, storeName } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addItem, itemCount, cart, isDifferentStore, getItemQty, updateQty } = useCart();
  const c = theme.colors;

  const [store, setStore] = useState<Store | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const toastAnim = useRef(new RNAnimated.Value(0)).current;

  const fetchMenu = useCallback(async () => {
    try {
      const [storeRes, menuRes] = await Promise.allSettled([
        storesApi.get(storeId),
        storesApi.menu(storeId),
      ]);
      if (storeRes.status === 'fulfilled' && storeRes.value.data.success) {
        const d = storeRes.value.data.data as any;
        setStore(d?.store ?? d);
      }
      if (menuRes.status === 'fulfilled' && menuRes.value.data.success) {
        const items = resolveMenuItems(menuRes.value.data.data as any);
        setMenu(items);
        const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
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
        'Start new cart?',
        `Your cart has items from "${cart.storeName}". Adding this will clear it.`,
        [
          { text: 'Keep current', style: 'cancel' },
          { text: 'Start fresh', style: 'destructive', onPress: () => doAdd(item) },
        ],
      );
      return;
    }
    doAdd(item);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    toastAnim.setValue(0);
    RNAnimated.spring(toastAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }).start();
    setTimeout(() => {
      RNAnimated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setToastVisible(false),
      );
    }, 2000);
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
    showToast(`${item.name} added to cart`);
  };

  const imageUri = resolveImageUrl(store?.image_url);
  const hours = store ? formatOperatingHours(store.operating_hours) : null;
  const availableCount = filteredMenu.filter((i) => i.is_available).length;

  // Hero parallax
  const heroTranslate = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  // Back button opacity on scroll
  const backBgOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0.45, 0.85],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.onSurfaceVariant }]}>Loading menu…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenBars style="light" backgroundColor={String(c.primary)} />
      <RNAnimated.FlatList
        data={filteredMenu.filter((i) => i.is_available)}
        keyExtractor={(i) => i._id}
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <>
            {/* ── Hero Image ─────────────────────────────── */}
            <View style={styles.heroContainer}>
              <RNAnimated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: heroTranslate }] }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[c.primary, c.tertiary ?? c.primaryContainer]} style={StyleSheet.absoluteFill} />
                )}
              </RNAnimated.View>
              {/* Gradient scrim */}
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
                style={StyleSheet.absoluteFill}
              />
              {/* Store name & status in hero */}
              <View style={[styles.heroBottom, { paddingBottom: spacing.xl }]}>
                <View style={[styles.statusPill, { backgroundColor: store?.is_active ? '#22C55E' : '#EF4444' }]}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{store?.is_active ? 'Open now' : 'Closed'}</Text>
                </View>
                <Text style={styles.heroStoreName}>{storeName}</Text>
                {store?.description ? (
                  <Text style={styles.heroDesc} numberOfLines={2}>{store.description}</Text>
                ) : null}
              </View>
            </View>

            {/* ── Info strip ────────────────────────────── */}
            <View style={[styles.infoStrip, { backgroundColor: c.surface }]}>
              {hours ? (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={c.primary} />
                  <Text style={[styles.infoText, { color: c.onSurfaceVariant }]}>{hours}</Text>
                </View>
              ) : null}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="food-variant" size={16} color={c.primary} />
                <Text style={[styles.infoText, { color: c.onSurfaceVariant }]}>{menu.length} items</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color={c.primary} />
                <Text style={[styles.infoText, { color: c.onSurfaceVariant }]}>Fast pickup</Text>
              </View>
            </View>

            {/* ── Category chips ────────────────────────── */}
            {categories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {[null, ...categories].map((cat) => {
                  const active = cat === selectedCategory;
                  return (
                    <Pressable
                      key={cat ?? '__all__'}
                      onPress={() => { setSelectedCategory(cat); Haptics.selectionAsync(); }}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? c.primary : c.surfaceVariant },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? c.onPrimary : c.onSurfaceVariant }]}>
                        {cat ?? 'All'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* ── Section header ────────────────────────── */}
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.base }]}>
              <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Menu</Text>
              <View style={[styles.countBadge, { backgroundColor: c.primaryContainer }]}>
                <Text style={[styles.countText, { color: c.onPrimaryContainer }]}>{availableCount}</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={[styles.emptyTitle, { color: c.onSurface }]}>Nothing available right now</Text>
            <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>Check back soon!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
            <MenuItemCard
              item={item}
              quantity={getItemQty(item._id)}
              onAdd={() => handleAdd(item)}
              onRemove={() => updateQty(item._id, getItemQty(item._id) - 1)}
            />
          </View>
        )}
      />

      {/* ── Back button (floating, always visible) ─── */}
      <RNAnimated.View
        style={[
          styles.backBtn,
          { top: insets.top + 8, backgroundColor: backBgOpacity.interpolate({ inputRange: [0.45, 0.85], outputRange: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.8)'] }) },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtnInner}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>
      </RNAnimated.View>

      {/* ── Cart FAB ──────────────────────────────── */}
      {itemCount > 0 && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 16 }]}>
          <FAB
            label={`View Cart  •  ${itemCount} item${itemCount > 1 ? 's' : ''}`}
            icon="cart"
            onPress={() => navigation.navigate('Cart')}
            style={{ backgroundColor: c.primary }}
            color={c.onPrimary}
          />
        </View>
      )}

      {/* ── M3 Toast ──────────────────────────────── */}
      {toastVisible && (
        <RNAnimated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { backgroundColor: c.inverseSurface, bottom: insets.bottom + (itemCount > 0 ? 88 : 24) },
            {
              opacity: toastAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={c.inverseOnSurface} />
          <Text style={[styles.toastText, { color: c.inverseOnSurface }]}>{toastMsg}</Text>
        </RNAnimated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  heroContainer: { height: HERO_HEIGHT, overflow: 'hidden', justifyContent: 'flex-end' },
  heroBottom: { paddingHorizontal: spacing.base, gap: 6 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 5,
    marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' },
  statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  heroStoreName: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  infoStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  chipsScroll: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  countBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  backBtn: {
    position: 'absolute',
    left: spacing.base,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backBtnInner: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  fabContainer: { position: 'absolute', alignSelf: 'center' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    elevation: 6,
  },
  toastText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
});
