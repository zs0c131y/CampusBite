import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StudentStackParamList, StudentTabParamList } from './types';
import { useCart } from '@/contexts/CartContext';

import HomeScreen from '@/screens/student/HomeScreen';
import StoreMenuScreen from '@/screens/student/StoreMenuScreen';
import CartScreen from '@/screens/student/CartScreen';
import CheckoutScreen from '@/screens/student/CheckoutScreen';
import OrderTrackingScreen from '@/screens/student/OrderTrackingScreen';
import OrderHistoryScreen from '@/screens/student/OrderHistoryScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator<StudentStackParamList>();
const Tab = createBottomTabNavigator<StudentTabParamList>();

// ── Custom M3 Navigation Bar ──────────────────────────────────────────────────

type TabIconName = 'home' | 'home-outline' | 'receipt-text' | 'receipt-text-outline' | 'cart' | 'cart-outline' | 'account' | 'account-outline';

interface TabBarItemProps {
  label: string;
  icon: TabIconName;
  activeIcon: TabIconName;
  isFocused: boolean;
  badge?: number;
  onPress: () => void;
  color: string;
  indicatorColor: string;
}

function TabBarItem({ label, icon, activeIcon, isFocused, badge, onPress, color, indicatorColor }: TabBarItemProps) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1 : 0.85, { damping: 12 }) }],
    opacity: withSpring(isFocused ? 1 : 0.7, { damping: 12 }),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 14 }) }],
    opacity: withSpring(isFocused ? 1 : 0, { damping: 14 }),
  }));

  return (
    <Pressable style={styles.tabItem} onPress={onPress} android_ripple={{ color: 'transparent' }}>
      <View style={styles.tabIconContainer}>
        {/* Filled pill indicator */}
        <Animated.View style={[styles.indicator, { backgroundColor: indicatorColor }, indicatorStyle]} />
        <Animated.View style={animStyle}>
          <View style={{ position: 'relative' }}>
            <MaterialCommunityIcons
              name={isFocused ? activeIcon : icon}
              size={24}
              color={color}
            />
            {badge != null && badge > 0 && (
              <View style={[styles.badge, { backgroundColor: color }]}>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
      <Animated.Text style={[styles.tabLabel, { color, fontSize: isFocused ? 12 : 11, fontWeight: isFocused ? '600' : '400' }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: 'home-outline' as TabIconName, activeIcon: 'home' as TabIconName },
    { name: 'OrdersTab', label: 'Orders', icon: 'receipt-text-outline' as TabIconName, activeIcon: 'receipt-text' as TabIconName },
    { name: 'CartTab', label: 'Cart', icon: 'cart-outline' as TabIconName, activeIcon: 'cart' as TabIconName },
    { name: 'ProfileTab', label: 'Profile', icon: 'account-outline' as TabIconName, activeIcon: 'account' as TabIconName },
  ];

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: theme.colors.elevation.level2,
        paddingBottom: insets.bottom,
        borderTopColor: theme.colors.outlineVariant,
      },
    ]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];
        const badge = tab.name === 'CartTab' ? itemCount : undefined;

        return (
          <TabBarItem
            key={route.key}
            label={tab.label}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            isFocused={isFocused}
            badge={badge}
            color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            indicatorColor={theme.colors.primaryContainer}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

// ── Student Tab Navigator ─────────────────────────────────────────────────────

function StudentTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} />
      <Tab.Screen name="CartTab" component={CartScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Student Stack Navigator ───────────────────────────────────────────────────

export function StudentNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="Home" component={StudentTabs} />
      <Stack.Screen name="StoreMenu" component={StoreMenuScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabIconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  indicator: {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
  },
  tabLabel: {
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
