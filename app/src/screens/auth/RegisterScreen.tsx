import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import type { RegisterScreenProps } from '@/navigation/types';
import type { UserRole } from '@/api/types';
import { spacing, radius } from '@/theme';

const ROLES: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  { value: 'student', label: 'Student', emoji: '🎓', desc: 'Enroll ID required' },
  { value: 'faculty', label: 'Faculty', emoji: '👩‍🏫', desc: 'Staff member' },
  { value: 'store_employee', label: 'Store Owner', emoji: '🧑‍🍳', desc: 'Manage canteen' },
];

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === 'student' && registerNumber ? { register_number: registerNumber } : {}),
      });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.response?.data?.message ?? e.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const c = theme.colors;

  return (
    <LinearGradient
      colors={[c.background, c.secondaryContainer + '30', c.background]}
      locations={[0, 0.6, 1]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: c.primary, fontSize: 16 }}>← Back</Text>
          </Pressable>

          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
            <Text variant="displaySmall" style={[styles.title, { color: c.onSurface }]}>
              Create account ✨
            </Text>
            <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant, marginTop: 4 }}>
              Join CampusBite today
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={1}>

              {/* Role selector */}
              <Text variant="titleSmall" style={[styles.sectionLabel, { color: c.onSurface }]}>
                I am a…
              </Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => { setRole(r.value); Haptics.selectionAsync(); }}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: role === r.value ? c.primaryContainer : c.surfaceVariant,
                        borderColor: role === r.value ? c.primary : 'transparent',
                        borderWidth: role === r.value ? 2 : 0,
                      },
                    ]}
                  >
                    <Text style={styles.roleEmoji}>{r.emoji}</Text>
                    <Text variant="labelMedium" style={{ color: role === r.value ? c.onPrimaryContainer : c.onSurfaceVariant, fontWeight: '600' }}>
                      {r.label}
                    </Text>
                    <Text variant="bodySmall" style={{ color: role === r.value ? c.onPrimaryContainer : c.onSurfaceVariant, opacity: 0.7, textAlign: 'center', marginTop: 2 }}>
                      {r.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Name */}
              <TextInput
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                mode="outlined"
                left={<TextInput.Icon icon="account-outline" />}
                style={styles.input}
                outlineStyle={{ borderRadius: radius.md }}
              />

              {/* Email */}
              <TextInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                mode="outlined"
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineStyle={{ borderRadius: radius.md }}
              />

              {/* Password */}
              <TextInput
                label="Password (min. 8 chars)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
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

              {/* Optional: register number for students */}
              {role === 'student' && (
                <Animated.View entering={FadeInDown.duration(250)}>
                  <TextInput
                    label="Register number (optional)"
                    value={registerNumber}
                    onChangeText={setRegisterNumber}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    mode="outlined"
                    left={<TextInput.Icon icon="identifier" />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: radius.md }}
                  />
                </Animated.View>
              )}

              {/* Error */}
              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                  <Text variant="bodySmall" style={{ color: c.onErrorContainer }}>{error}</Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.btn}
                contentStyle={styles.btnContent}
                labelStyle={styles.btnLabel}
              >
                Create Account
              </Button>

              <View style={styles.loginRow}>
                <Text variant="bodyMedium" style={{ color: c.onSurfaceVariant }}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text variant="bodyMedium" style={{ color: c.primary, fontWeight: '600' }}>Sign In</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: spacing.base },
  backBtn: { marginBottom: spacing.base },
  header: { marginBottom: spacing.xl },
  title: { fontWeight: '700', letterSpacing: -0.5 },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  sectionLabel: { fontWeight: '600', marginBottom: spacing.md },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  roleCard: { flex: 1, alignItems: 'center', borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  roleEmoji: { fontSize: 28, marginBottom: spacing.xs },
  input: { marginBottom: spacing.md },
  errorBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  btn: { borderRadius: radius.lg },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 16, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
