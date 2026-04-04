import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  saveUser,
  getUser,
  clearAuthData,
} from '@/storage';
import type { User, RegisterPayload } from '@/api/types';

// ── State ─────────────────────────────────────────────────────────────────────

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User };

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'SIGN_IN'; user: User }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_USER'; user: User };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':      return { status: 'loading' };
    case 'SIGN_IN':      return { status: 'authenticated', user: action.user };
    case 'SIGN_OUT':     return { status: 'unauthenticated' };
    case 'UPDATE_USER':  return { status: 'authenticated', user: action.user };
    default:             return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          dispatch({ type: 'SIGN_OUT' });
          return;
        }
        // Try to load cached user first for instant render
        const cached = await getUser<User>();
        if (cached) dispatch({ type: 'SIGN_IN', user: cached });
        // Then refresh from API
        const { data } = await usersApi.profile();
        if (data.success) {
          await saveUser(data.data);
          dispatch({ type: 'SIGN_IN', user: data.data });
        }
      } catch {
        dispatch({ type: 'SIGN_OUT' });
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data } = await authApi.login(email, password);
    if (!data.success) throw new Error(data.message ?? 'Login failed');
    const { user, accessToken, refreshToken } = data.data;
    await saveTokens(accessToken, refreshToken);
    await saveUser(user);
    dispatch({ type: 'SIGN_IN', user });
    return user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    const { data } = await authApi.register(payload);
    if (!data.success) throw new Error(data.message ?? 'Registration failed');
    const { user, accessToken, refreshToken } = data.data;
    await saveTokens(accessToken, refreshToken);
    await saveUser(user);
    dispatch({ type: 'SIGN_IN', user });
  }, []);

  const logout = useCallback(async () => {
    try {
      const rt = await getRefreshToken();
      if (rt) await authApi.logout(rt);
    } catch { /* ignore */ }
    await clearAuthData();
    dispatch({ type: 'SIGN_OUT' });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApi.profile();
      if (data.success) {
        await saveUser(data.data);
        dispatch({ type: 'UPDATE_USER', user: data.data });
      }
    } catch { /* ignore */ }
  }, []);

  const user = state.status === 'authenticated' ? state.user : null;

  return (
    <AuthContext.Provider
      value={{
        state,
        user,
        isAuthenticated: state.status === 'authenticated',
        isLoading: state.status === 'loading',
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
