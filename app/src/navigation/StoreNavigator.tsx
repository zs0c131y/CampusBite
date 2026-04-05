import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StoreStackParamList, StoreTabParamList } from './types';
import DashboardScreen from '@/screens/store/DashboardScreen';
import StoreOrdersScreen from '@/screens/store/OrdersScreen';
import OrderDetailScreen from '@/screens/store/OrderDetailScreen';
import MenuManagementScreen from '@/screens/store/MenuManagementScreen';
import StoreSettingsScreen from '@/screens/store/StoreSettingsScreen';
import ProfileScreen from '@/screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator<StoreStackParamList>();
const Tab = createBottomTabNavigator<StoreTabParamList>();

type IconName =
  | 'receipt-text' | 'receipt-text-outline'
  | 'view-dashboard' | 'view-dashboard-outline'
  | 'food' | 'food-outline'
  | 'cog' | 'cog-outline';

const STORE_TABS = [
  { name: 'OrdersTab',    label: 'Orders',    icon: 'receipt-text-outline' as IconName,   activeIcon: 'receipt-text' as IconName },
  { name: 'DashboardTab', label: 'Dashboard', icon: 'view-dashboard-outline' as IconName, activeIcon: 'view-dashboard' as IconName },
  { name: 'MenuTab',      label: 'Menu',      icon: 'food-outline' as IconName,           activeIcon: 'food' as IconName },
  { name: 'SettingsTab',  label: 'Settings',  icon: 'cog-outline' as IconName,            activeIcon: 'cog' as IconName },
];

// ── Individual tab item — hooks must live inside a component, not in a .map() ─

interface StoreTabItemProps {
  tab: typeof STORE_TABS[number];
  isFocused: boolean;
  onPress: () => void;
  primaryColor: string;
  primaryContainer: string;
  onSurfaceVariant: string;
}

function StoreTabItem({ tab, isFocused, onPress, primaryColor, primaryContainer, onSurfaceVariant }: StoreTabItemProps) {
  const color = isFocused ? primaryColor : onSurfaceVariant;

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
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.indicator, { backgroundColor: primaryContainer }, indicatorStyle]} />
        <Animated.View style={animStyle}>
          <MaterialCommunityIcons name={isFocused ? tab.activeIcon : tab.icon} size={24} color={color} />
        </Animated.View>
      </View>
      <Text style={[styles.label, {
        color,
        fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
        fontSize: isFocused ? 12 : 11,
      }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function StoreTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, {
      backgroundColor: theme.colors.elevation.level2,
      paddingBottom: insets.bottom,
      borderTopColor: theme.colors.outlineVariant,
    }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = STORE_TABS[index];
        return (
          <StoreTabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            onPress={() => !isFocused && navigation.navigate(route.name)}
            primaryColor={theme.colors.primary}
            primaryContainer={theme.colors.primaryContainer}
            onSurfaceVariant={theme.colors.onSurfaceVariant}
          />
        );
      })}
    </View>
  );
}

// ── Navigators ────────────────────────────────────────────────────────────────

function StoreTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <StoreTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="OrdersTab" component={StoreOrdersScreen} />
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="MenuTab" component={MenuManagementScreen} />
      <Tab.Screen name="SettingsTab" component={StoreSettingsScreen} />
    </Tab.Navigator>
  );
}

export function StoreNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="Orders" component={StoreTabs} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="MenuManagement" component={MenuManagementScreen} />
      <Stack.Screen name="StoreSettings" component={StoreSettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    elevation: Platform.OS === 'android' ? 12 : 0,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  iconWrap: {
    width: 64, height: 32,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 4,
  },
  indicator: { position: 'absolute', inset: 0, borderRadius: 16 },
  label: { letterSpacing: 0.2 },
});
