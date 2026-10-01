import type { OrderStatus, PaymentStatus, OperatingHours } from '@/api/types';

// ── Image URL resolver ────────────────────────────────────────────────────────

const SERVER_URL = (() => {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api';
  const url = __DEV__ ? raw : raw.replace(/^http:/, 'https:');
  return url.match(/^https?:\/\/[^/]*/)?.[0] ?? '';
})();

export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_URL}${url}`;
}

// ── Color opacity ────────────────────────────────────────────────────────────

export function withOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number | undefined | null): string {
  return `₹${(amount ?? 0).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Operating hours ───────────────────────────────────────────────────────────

export function formatOperatingHours(hours?: OperatingHours | string | null): string {
  if (!hours) return '';
  if (typeof hours === 'string') return hours;
  const open = hours.open ?? hours.opening_time;
  const close = hours.close ?? hours.closing_time;
  if (open && close) return `${open} – ${close}`;
  if (open) return `Opens ${open}`;
  return '';
}

// ── Order status helpers ──────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  accepted: 'Accepted',
  processing: 'Preparing',
  ready: 'Ready for Pickup!',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_EMOJI: Record<OrderStatus, string> = {
  placed: '🧾',
  accepted: '✅',
  processing: '👨‍🍳',
  ready: '🎉',
  picked_up: '🛍️',
  cancelled: '❌',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Payment Pending',
  success: 'Paid',
  failed: 'Payment Failed',
};

export function isActiveOrder(status: OrderStatus): boolean {
  return ['placed', 'accepted', 'processing', 'ready'].includes(status);
}

// ── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(name?: string): { text: string; emoji: string } {
  const hour = new Date().getHours();
  let text: string;
  let emoji: string;

  if (hour < 5) { text = 'Good night'; emoji = '🌙'; }
  else if (hour < 12) { text = 'Good morning'; emoji = '☀️'; }
  else if (hour < 17) { text = 'Good afternoon'; emoji = '🌤️'; }
  else if (hour < 21) { text = 'Good evening'; emoji = '🌅'; }
  else { text = 'Good night'; emoji = '🌙'; }

  if (name) text = `${text}, ${name.split(' ')[0]}!`;
  return { text, emoji };
}

// ── UPI deep link ─────────────────────────────────────────────────────────────

export function buildUpiLink(params: {
  upiId: string;
  payee: string;
  amount: number;
  transactionNote: string;
  transactionRef: string;
}): string {
  const { upiId, payee, amount, transactionNote, transactionRef } = params;
  return (
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(payee)}` +
    `&am=${amount.toFixed(2)}` +
    `&tn=${encodeURIComponent(transactionNote)}` +
    `&tr=${encodeURIComponent(transactionRef)}` +
    `&cu=INR`
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function storeId(store: string | { _id: string }): string {
  return typeof store === 'string' ? store : store._id;
}

export function storeName(store: string | { _id: string; name: string }): string {
  return typeof store === 'string' ? '' : store.name;
}