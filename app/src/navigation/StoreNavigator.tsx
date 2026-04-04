import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable } from 'react-native';
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

type IconName = 'receipt-text' | 'receipt-text-outline' | 'view-dashboard' | 'view-dashboard-outline' | 'food' | 'food-outline' | 'cog' | 'cog-outline';

const STORE_TABS = [
  { name: 'OrdersTab', label: 'Orders', icon: 'receipt-text-outline' as IconName, activeIcon: 'receipt-text' as IconName },
  { name: 'DashboardTab', label: 'Dashboard', icon: 'view-dashboard-outline' as IconName, activeIcon: 'view-dashboard' as IconName },
  { name: 'MenuTab', label: 'Menu', icon: 'food-outline' as IconName, activeIcon: 'food' as IconName },
  { name: 'SettingsTab', label: 'Settings', icon: 'cog-outline' as IconName, activeIcon: 'cog' as IconName },
];

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
        const color = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

        const animStyle = useAnimatedStyle(() => ({
          transform: [{ scale: withSpring(isFocused ? 1 : 0.85) }],
        }));

        const indicatorStyle = useAnimatedStyle(() => ({
          transform: [{ scaleX: withSpring(isFocused ? 1 : 0) }],
          opacity: withSpring(isFocused ? 1 : 0),
        }));

        return (
          <Pressable
            key={route.key}
            style={styles.tabItem}
            onPress={() => !isFocused && navigation.navigate(route.name)}
          >
            <View style={styles.iconWrap}>
              <Animated.View style={[styles.indicator, { backgroundColor: theme.colors.primaryContainer }, indicatorStyle]} />
              <Animated.View style={animStyle}>
                <MaterialCommunityIcons name={isFocused ? tab.activeIcon : tab.icon} size={24} color={color} />
              </Animated.View>
            </View>
            <Animated.Text style={[styles.label, { color, fontWeight: isFocused ? '600' : '400', fontSize: isFocused ? 12 : 11 }]}>
              {tab.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  iconWrap: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4 },
  indicator: { position: 'absolute', inset: 0, borderRadius: 16 },
  label: { letterSpacing: 0.2 },
});
