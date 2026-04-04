import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ── Auth stack ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { token?: string };
};

// ── Student tabs ──────────────────────────────────────────────────────────────

export type StudentTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

// ── Student stack (nested inside tabs) ───────────────────────────────────────

export type StudentStackParamList = {
  Home: undefined;
  StoreMenu: { storeId: string; storeName: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Profile: undefined;
};

// ── Store tabs ────────────────────────────────────────────────────────────────

export type StoreTabParamList = {
  OrdersTab: undefined;
  DashboardTab: undefined;
  MenuTab: undefined;
  SettingsTab: undefined;
};

// ── Store stack ───────────────────────────────────────────────────────────────

export type StoreStackParamList = {
  Dashboard: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  MenuManagement: undefined;
  StoreSettings: undefined;
  Profile: undefined;
};

// ── Root ──────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Student: undefined;
  Store: undefined;
};

// ── Screen prop types ─────────────────────────────────────────────────────────

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export type HomeScreenProps = NativeStackScreenProps<StudentStackParamList, 'Home'>;
export type StoreMenuScreenProps = NativeStackScreenProps<StudentStackParamList, 'StoreMenu'>;
export type CartScreenProps = NativeStackScreenProps<StudentStackParamList, 'Cart'>;
export type CheckoutScreenProps = NativeStackScreenProps<StudentStackParamList, 'Checkout'>;
export type OrderTrackingScreenProps = NativeStackScreenProps<StudentStackParamList, 'OrderTracking'>;
export type OrderHistoryScreenProps = NativeStackScreenProps<StudentStackParamList, 'OrderHistory'>;

export type DashboardScreenProps = NativeStackScreenProps<StoreStackParamList, 'Dashboard'>;
export type StoreOrdersScreenProps = NativeStackScreenProps<StoreStackParamList, 'Orders'>;
export type OrderDetailScreenProps = NativeStackScreenProps<StoreStackParamList, 'OrderDetail'>;
export type MenuManagementScreenProps = NativeStackScreenProps<StoreStackParamList, 'MenuManagement'>;
export type StoreSettingsScreenProps = NativeStackScreenProps<StoreStackParamList, 'StoreSettings'>;
