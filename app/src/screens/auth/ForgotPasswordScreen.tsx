import React, { useState } from 'react';
import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[c.background, c.primaryContainer + '30', c.background]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: c.primary }}>← Back</Text>
          </Pressable>

          <Animated.View entering={FadeInDown.springify()} style={styles.center}>
            <Text style={styles.emoji}>🔐</Text>
            <Text variant="headlineMedium" style={[styles.title, { color: c.onSurface }]}>
              {sent ? 'Email sent!' : 'Reset password'}
            </Text>
            <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              {sent
                ? `We sent a reset link to ${email}. Check your inbox!`
                : 'Enter your email and we\'ll send you a reset link.'}
            </Text>

            {!sent && (
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>
                <TextInput
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={{ marginBottom: spacing.base }}
                  outlineStyle={{ borderRadius: radius.md }}
                />
                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                    <Text variant="bodySmall" style={{ color: c.onErrorContainer }}>{error}</Text>
                  </View>
                )}
                <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={{ borderRadius: radius.lg }} contentStyle={{ height: 52 }} labelStyle={{ fontSize: 16, fontWeight: '600' }}>
                  Send Reset Link
                </Button>
              </Surface>
            )}

            {sent && (
              <Button mode="contained-tonal" onPress={() => navigation.navigate('Login')} style={{ borderRadius: radius.lg }} contentStyle={{ height: 52 }}>
                Back to Sign In
              </Button>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.base },
  backBtn: { marginBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: spacing.base },
  title: { fontWeight: '700' },
  card: { width: '100%', borderRadius: radius.xl, padding: spacing.xl },
  errorBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.base },
});
