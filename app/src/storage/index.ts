import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'cb_access_token',
  REFRESH_TOKEN: 'cb_refresh_token',
  USER: 'cb_user',
  CART: 'cb_cart',
} as const;

// ── Tokens ────────────────────────────────────────────────────────────────────

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

// ── User ─────────────────────────────────────────────────────────────────────

export async function saveUser(user: object) {
  await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
}

export async function getUser<T = unknown>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearUser() {
  await SecureStore.deleteItemAsync(KEYS.USER);
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export async function saveCart(cart: object) {
  await SecureStore.setItemAsync(KEYS.CART, JSON.stringify(cart));
}

export async function getCart<T = unknown>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(KEYS.CART);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearCart() {
  await SecureStore.deleteItemAsync(KEYS.CART);
}

// ── Auth clear-all ────────────────────────────────────────────────────────────

export async function clearAuthData() {
  await Promise.all([clearTokens(), clearUser()]);
}
