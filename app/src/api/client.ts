import axios from 'axios';
import { clearAuthData, getAccessToken, getRefreshToken, saveTokens } from '@/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api';

// Server root (strips any path after the host) — used to resolve relative upload URLs like /uploads/...
// Uses regex instead of new URL() to avoid Hermes/RN polyfill issues at module init time.
export const SERVER_URL = BASE_URL.match(/^https?:\/\/[^/]*/)?.[0] ?? '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request: attach Bearer token ──────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the system set multipart boundaries for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        if (data.success) {
          await saveTokens(data.data.accessToken, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        }
      } catch {
        await clearAuthData();
        // Navigation to login is handled in AuthContext via token absence check
      }
    }
    return Promise.reject(error);
  },
);

export default api;
