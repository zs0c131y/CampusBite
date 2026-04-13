import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ScreenBars } from '@/components/ScreenBars';
import * as Haptics from 'expo-haptics';

import { authApi } from '@/api/auth';
import type { ForgotPasswordScreenProps } from '@/navigation/types';
import { spacing, radius } from '@/theme';

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const c = theme.colors;

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await authApi.forgotPassword(email.trim().toLowerCase());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.response?.data?.message ?? 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[c.primaryContainer + 'AA', c.background, c.background]}
      locations={[0, 0.4, 1]}
      style={styles.gradient}
    >
      <ScreenBars style="dark" backgroundColor={String(c.background)} />
      <View style={[styles.blob1, { backgroundColor: c.primary + '18' }]} />
      <View style={[styles.blob2, { backgroundColor: c.tertiary + '14' }]} />

      <View style={{ height: insets.top }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          entering={FadeIn.duration(220)}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <Text style={[styles.appName, { color: c.primary }]}>CampusBite</Text>
          </View>

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: c.primaryContainer }]}>
                <MaterialCommunityIcons name="email-check-outline" size={48} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.onSurface }]}>Check your inbox</Text>
              <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
                We sent a reset link to{'\n'}
                <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={[styles.btn, { marginTop: spacing.xl }]}
                contentStyle={styles.btnContent}
                labelStyle={styles.btnLabel}
                icon="arrow-left"
              >
                Back to Sign In
              </Button>
            </View>
          ) : (
            /* ── Form state ── */
            <>
              <View style={styles.header}>
                <Text style={[styles.title, { color: c.onSurface }]}>Reset password</Text>
                <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
                  Enter your email and we'll send you a reset link.
                </Text>
              </View>

              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={2}>
                <TextInput
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  mode="outlined"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  outlineStyle={{ borderRadius: radius.md }}
                />

                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={15} color={c.onErrorContainer} />
                    <Text style={[styles.errorText, { color: c.onErrorContainer }]}>{error}</Text>
                  </View>
                )}

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={styles.btn}
                  contentStyle={styles.btnContent}
                  labelStyle={styles.btnLabel}
                  icon="send-outline"
                >
                  Send Reset Link
                </Button>
              </Surface>
            </>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  blob1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    top: -80, right: -80,
  },
  blob2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    bottom: 100, left: -60,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingTop: 16,
  },
  brand: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 40, height: 40, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  appName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  input: { marginBottom: spacing.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.base,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  btn: { borderRadius: radius.lg },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },

  // Success
  successWrap: { alignItems: 'center', paddingTop: spacing.xl },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
});
