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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
      // Navigation handled automatically by RootNavigator
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.response?.data?.message ?? e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const c = theme.colors;

  return (
    <LinearGradient
      colors={[c.background, c.primaryContainer + '40', c.background]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.brand}>
            <Surface
              style={[styles.logoSurface, { backgroundColor: c.primaryContainer }]}
              elevation={2}
            >
              <Text style={[styles.logoEmoji]}>🍽️</Text>
            </Surface>
            <Text variant="displaySmall" style={[styles.appName, { color: c.primary }]}>
              CampusBite
            </Text>
            <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 4 }}>
              Your campus food companion
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
              <Text variant="headlineSmall" style={[styles.heading, { color: c.onSurface }]}>
                Welcome back 👋
              </Text>
              <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginBottom: spacing.xl }}>
                Sign in to continue ordering
              </Text>

              {/* Email */}
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

              {/* Password */}
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

              {/* Forgot password */}
              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotRow}
              >
                <Text variant="labelMedium" style={{ color: c.primary }}>
                  Forgot password?
                </Text>
              </Pressable>

              {/* Error */}
              {!!error && (
                <Animated.View entering={FadeInDown.duration(200)} style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                  <Text variant="bodySmall" style={{ color: c.onErrorContainer }}>
                    {error}
                  </Text>
                </Animated.View>
              )}

              {/* Login button */}
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

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant }}>
                  Don't have an account?{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text variant="bodyMedium" style={{ color: c.primary, fontWeight: '600' }}>
                    Register
                  </Text>
                </Pressable>
              </View>
            </Surface>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.base, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logoSurface: { width: 80, height: 80, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoEmoji: { fontSize: 40 },
  appName: { fontWeight: '700', letterSpacing: -0.5 },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  heading: { fontWeight: '700', marginBottom: 4 },
  input: { marginBottom: spacing.md },
  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.base },
  errorBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.base },
  btn: { borderRadius: radius.lg, marginTop: spacing.xs },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
