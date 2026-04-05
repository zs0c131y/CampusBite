import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { OrderStatus } from '@/api/types';

// expo-notifications remote push support was removed from Expo Go in SDK 53.
// Use dynamic import so the module is never loaded in Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return false;
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function setupNotificationChannel() {
  if (isExpoGo || Platform.OS !== 'android') return;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    await Notifications.setNotificationChannelAsync('order-status', {
      name: 'Order Status',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C56200',
    });
  } catch {}
}

const STATUS_NOTIFICATION: Record<OrderStatus, { title: string; body: string } | null> = {
  placed:     null,
  accepted:   { title: 'Order Accepted!', body: 'The store has accepted your order.' },
  processing: { title: 'Preparing your order', body: 'The store is now preparing your food.' },
  ready:      { title: 'Ready for Pickup!', body: 'Your order is ready. Show your OTP at the counter.' },
  picked_up:  { title: 'Order Complete!', body: 'Enjoy your meal!' },
  cancelled:  { title: 'Order Cancelled', body: 'Your order has been cancelled.' },
};

export async function sendOrderStatusNotification(status: OrderStatus, orderNumber: string) {
  if (isExpoGo) return;
  const cfg = STATUS_NOTIFICATION[status];
  if (!cfg) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: cfg.title,
        body: `Order #${orderNumber} — ${cfg.body}`,
        data: { orderNumber, status },
        ...(Platform.OS === 'android' && { channelId: 'order-status' }),
      },
      trigger: null,
    });
  } catch {}
}
