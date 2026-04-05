import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
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

type TabIconName =
  | 'home' | 'home-outline'
  | 'receipt-text' | 'receipt-text-outline'
  | 'cart' | 'cart-outline'
  | 'account' | 'account-outline';

interface TabBarItemProps {
  label: string;
  icon: TabIconName;
  activeIcon: TabIconName;
  isFocused: boolean;
  badge?: number;
  onPress: () => void;
  color: string;
  indicatorColor: string;
  errorColor: string;
}

function TabBarItem({ label, icon, activeIcon, isFocused, badge, onPress, color, indicatorColor, errorColor }: TabBarItemProps) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1 : 0.85, { damping: 14, stiffness: 180 }) }],
    opacity: withSpring(isFocused ? 1 : 0.65, { damping: 14 }),
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 200 }) }],
    opacity: withSpring(isFocused ? 1 : 0, { damping: 16 }),
  }));

  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      android_ripple={{ color: 'transparent' }}
      hitSlop={8}
    >
      <View style={styles.tabIconContainer}>
        {/* Pill indicator */}
        <Animated.View style={[styles.indicator, { backgroundColor: indicatorColor }, indicatorStyle]} />
        <Animated.View style={animStyle}>
          <View>
            <MaterialCommunityIcons name={isFocused ? activeIcon : icon} size={24} color={color} />
            {badge != null && badge > 0 && (
              <View style={[styles.badge, { backgroundColor: errorColor }]}>
                <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
      <Text style={[styles.tabLabel, {
        color,
        fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
        fontSize: isFocused ? 12 : 11,
      }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  const tabs = [
    { name: 'HomeTab',    label: 'Home',    icon: 'home-outline' as TabIconName,         activeIcon: 'home' as TabIconName },
    { name: 'OrdersTab',  label: 'Orders',  icon: 'receipt-text-outline' as TabIconName, activeIcon: 'receipt-text' as TabIconName },
    { name: 'CartTab',    label: 'Cart',    icon: 'cart-outline' as TabIconName,          activeIcon: 'cart' as TabIconName },
    { name: 'ProfileTab', label: 'Profile', icon: 'account-outline' as TabIconName,       activeIcon: 'account' as TabIconName },
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
        return (
          <TabBarItem
            key={route.key}
            label={tab.label}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            isFocused={isFocused}
            badge={tab.name === 'CartTab' ? itemCount : undefined}
            color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            indicatorColor={theme.colors.primaryContainer}
            errorColor={theme.colors.error}
            onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    // Android elevation for shadow
    elevation: Platform.OS === 'android' ? 12 : 0,
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
    top: -4,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    lineHeight: 16,
    includeFontPadding: false,
  },
});
