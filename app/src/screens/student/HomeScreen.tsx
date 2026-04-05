import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl, TextInput } from 'react-native';
import { Text, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { storesApi } from '@/api/stores';
import { ordersApi } from '@/api/orders';
import { useAuth } from '@/contexts/AuthContext';
import type { Store, Order } from '@/api/types';
import type { StudentStackParamList } from '@/navigation/types';
import { getGreeting } from '@/utils';
import StoreCard from '@/components/StoreCard';
import { spacing, radius } from '@/theme';

type Nav = NativeStackNavigationProp<StudentStackParamList, 'Home'>;

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = getGreeting(user?.name);

  const fetchAll = useCallback(async () => {
    try {
      const [storesRes, ordersRes] = await Promise.allSettled([
        storesApi.list(),
        ordersApi.list({ status: 'placed,accepted,processing,ready' }),
      ]);
      if (storesRes.status === 'fulfilled' && storesRes.value.data.success) {
        const raw = storesRes.value.data.data;
        setStores(Array.isArray(raw) ? raw : (raw as any)?.stores ?? []);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
        setActiveOrders(ordersRes.value.data.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const c = theme.colors;

  // User initials avatar
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style="dark" />
      {/* Header with gradient */}
      <LinearGradient
        colors={[c.primaryContainer + 'CC', c.background]}
        locations={[0, 1]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          {/* Top row: greeting + avatar */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greetLine, { color: c.onSurfaceVariant }]}>
                {greeting.emoji}  {greeting.text}
              </Text>
              <Text style={[styles.tagline, { color: c.onSurface }]}>
                What are you craving?
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={[styles.avatar, { backgroundColor: c.primary }]}
            >
              <Text style={[styles.avatarText, { color: c.onPrimary }]}>{initials}</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchbar, { backgroundColor: c.elevation.level3, borderColor: c.outlineVariant }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={c.onSurfaceVariant} />
            <View style={styles.searchInputWrap}>
              {search.length === 0 && (
                <Text style={[styles.searchPlaceholder, { color: c.onSurfaceVariant }]} pointerEvents="none">
                  Search canteens…
                </Text>
              )}
              <TextInput
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: c.onSurface }]}
                returnKeyType="search"
              />
            </View>
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={c.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s._id}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: spacing.md }}
        ListHeaderComponent={
          <>
            {/* Active order banner */}
            {activeOrders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.bannerWrap}>
                <Pressable onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrders[0]._id })}>
                  <LinearGradient
                    colors={[c.primary, c.secondary ?? c.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeBanner}
                  >
                    <Text style={{ fontSize: 22 }}>🍱</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bannerTitle, { color: c.onPrimary }]}>
                        {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.bannerSub, { color: c.onPrimary + 'CC' }]}>
                        Tap to track your food
                      </Text>
                    </View>
                    <View style={[styles.bannerChevron, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={{ color: c.onPrimary, fontSize: 14, fontWeight: '700' }}>→</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Restriction warning */}
            {user?.trust_tier === 'restricted' && (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.bannerWrap}>
                <Surface style={[styles.warnBanner, { backgroundColor: c.errorContainer }]} elevation={0}>
                  <Text style={{ fontSize: 18 }}>⛔</Text>
                  <Text style={[styles.warnText, { color: c.onErrorContainer }]}>
                    Ordering restricted due to no-shows. This will lift automatically.
                  </Text>
                </Surface>
              </Animated.View>
            )}

            {/* Section header */}
            <View style={[styles.sectionRow, { paddingHorizontal: spacing.base }]}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.onSurface }]}>Campus Stores</Text>
                <Text style={[styles.sectionSub, { color: c.onSurfaceVariant }]}>
                  {filtered.length} outlet{filtered.length !== 1 ? 's' : ''} available
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text style={[styles.loadingText, { color: c.onSurfaceVariant }]}>
                Loading stores…
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: c.onSurface }]}>No stores found</Text>
              <Text style={[styles.emptySub, { color: c.onSurfaceVariant }]}>
                {search ? `Nothing matches "${search}"` : 'No food outlets available right now.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 60).springify()}
            layout={LinearTransition.springify()}
            style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}
          >
            <StoreCard
              store={item}
              onPress={() => navigation.navigate('StoreMenu', { storeId: item._id, storeName: item.name })}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingBottom: spacing.md },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.base },
  greetLine: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  tagline: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 52,
    borderWidth: 1,
  },
  searchInputWrap: { flex: 1, justifyContent: 'center' },
  searchPlaceholder: {
    position: 'absolute',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingVertical: 0,
  },
  bannerWrap: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  bannerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  bannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  bannerChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warnText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  loadingCenter: { alignItems: 'center', paddingTop: 80 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: spacing.md },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.base },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'center' },
});
