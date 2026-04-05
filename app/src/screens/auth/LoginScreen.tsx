import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Text, TextInput, Button, useTheme, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import type { LoginScreenProps } from '@/navigation/types';
import { spacing, radius } from '@/theme';

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<any>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
        setError('Cannot reach the server. Make sure the backend is running and your device is on the same network.');
      } else {
        setError(e.response?.data?.message ?? e.message ?? 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const c = theme.colors;

  return (
    <LinearGradient
      colors={[c.primaryContainer + 'AA', c.background, c.background]}
      locations={[0, 0.4, 1]}
      style={styles.gradient}
    >
      <StatusBar style="dark" />
      {/* Decorative blobs */}
      <View style={[styles.blob1, { backgroundColor: c.primary + '18' }]} />
      <View style={[styles.blob2, { backgroundColor: c.tertiary + '14' }]} />

      {/* Fixed status-bar zone — content cannot scroll into this area */}
      <View style={{ height: insets.top }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          entering={FadeIn.duration(220)}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <Text style={[styles.appName, { color: c.primary }]}>CampusBite</Text>
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.onSurface }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
              Sign in to continue ordering
            </Text>
          </View>

          {/* Form */}
          <View>
            <Surface style={styles.card} elevation={2}>
              <TextInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                mode="outlined"
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineStyle={{ borderRadius: radius.md }}
              />

              <TextInput
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                mode="outlined"
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword((v) => !v)}
                  />
                }
                style={styles.input}
                outlineStyle={{ borderRadius: radius.md }}
              />

              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotRow}
              >
                <Text style={[styles.forgotText, { color: c.primary }]}>Forgot password?</Text>
              </Pressable>

              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                  <Text style={[styles.errorText, { color: c.onErrorContainer }]}>{error}</Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.btn}
                contentStyle={styles.btnContent}
                labelStyle={styles.btnLabel}
              >
                Sign In
              </Button>
            </Surface>
          </View>

          {/* Footer */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: c.onSurfaceVariant }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: c.primary }]}>Register</Text>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  blob1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 100,
    left: -60,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  appName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  input: { marginBottom: spacing.md },
  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.base },
  forgotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  errorBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.base },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  btn: { borderRadius: radius.lg, marginTop: spacing.xs },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  registerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
