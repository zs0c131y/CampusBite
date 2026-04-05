import React, { useState } from 'react';
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
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import type { RegisterScreenProps } from '@/navigation/types';
import type { UserRole } from '@/api/types';
import { spacing, radius } from '@/theme';

const ROLES: {
  value: UserRole;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { value: 'student', label: 'Student', emoji: '🎓', desc: 'Order food as a student' },
  { value: 'faculty', label: 'Faculty', emoji: '👩‍🏫', desc: 'Order food as faculty' },
  { value: 'store_employee', label: 'Store Employee', emoji: '🧑‍🍳', desc: 'Manage your canteen' },
];

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | ''>('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role-specific
  const [registerNumber, setRegisterNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeUpiId, setStoreUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const c = theme.colors;

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    Haptics.selectionAsync();
  };

  const goToStep2 = () => {
    if (!role) { setError('Please select a role.'); return; }
    setError('');
    setStep(2);
  };

  const goBack = () => {
    setError('');
    setStep(1);
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'student' && !registerNumber.trim()) {
      setError('Register number is required for students.');
      return;
    }
    if ((role === 'faculty' || role === 'store_employee') && !employeeId.trim()) {
      setError('Employee ID is required.');
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
        confirmPassword,
        role: role as UserRole,
        ...(role === 'student' && { registerNumber: registerNumber.trim() }),
        ...(role === 'faculty' && { employeeId: employeeId.trim() }),
        ...(role === 'store_employee' && {
          employeeId: employeeId.trim(),
          phoneNumber: phoneNumber.trim(),
          storeName: storeName.trim(),
          storeUpiId: storeUpiId.trim(),
        }),
      });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(e.response?.data?.message ?? e.message ?? 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <LinearGradient
      colors={[c.secondaryContainer + 'AA', c.background, c.background]}
      locations={[0, 0.35, 1]}
      style={styles.gradient}
    >
      <StatusBar style="dark" />
      {/* Decorative blobs */}
      <View style={[styles.blob1, { backgroundColor: c.primary + '14' }]} />
      <View style={[styles.blob2, { backgroundColor: c.secondary + '10' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <Text style={[styles.appName, { color: c.primary }]}>CampusBite</Text>
          </Animated.View>

          {/* Title + step indicator */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
            <Text style={[styles.title, { color: c.onSurface }]}>
              {step === 1 ? 'Choose your role' : 'Create account'}
            </Text>
            <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
              {step === 1
                ? 'Select how you will use CampusBite'
                : `Registering as ${selectedRole?.label}`}
            </Text>

            {/* Step pill indicator */}
            <View style={styles.stepRow}>
              <View style={[styles.stepPill, { backgroundColor: c.primary }]}>
                <Text style={[styles.stepNum, { color: c.onPrimary }]}>1</Text>
              </View>
              <View
                style={[
                  styles.stepConnector,
                  { backgroundColor: step === 2 ? c.primary : c.outlineVariant },
                ]}
              />
              <View
                style={[
                  styles.stepPill,
                  { backgroundColor: step === 2 ? c.primary : c.outlineVariant },
                ]}
              >
                <Text
                  style={[
                    styles.stepNum,
                    { color: step === 2 ? c.onPrimary : c.onSurfaceVariant },
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: c.onSurfaceVariant }]}>
                {step === 1 ? 'Pick role' : 'Fill details'}
              </Text>
            </View>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Surface style={styles.card} elevation={2}>

              {/* ── Step 1: Role selection ── */}
              {step === 1 && (
                <Animated.View entering={FadeInRight.duration(250)}>
                  <View style={styles.roleList}>
                    {ROLES.map((r) => {
                      const selected = role === r.value;
                      return (
                        <Pressable
                          key={r.value}
                          onPress={() => handleRoleSelect(r.value)}
                          style={[
                            styles.roleCard,
                            {
                              backgroundColor: selected ? c.primaryContainer : c.surfaceVariant,
                              borderColor: selected ? c.primary : 'transparent',
                              borderWidth: 2,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.roleIconBox,
                              { backgroundColor: selected ? c.primary : c.surface },
                            ]}
                          >
                            <Text style={styles.roleEmoji}>{r.emoji}</Text>
                          </View>
                          <View style={styles.roleText}>
                            <Text
                              style={[
                                styles.roleLabel,
                                { color: selected ? c.onPrimaryContainer : c.onSurface },
                              ]}
                            >
                              {r.label}
                            </Text>
                            <Text
                              style={[
                                styles.roleDesc,
                                { color: selected ? c.onPrimaryContainer : c.onSurfaceVariant },
                              ]}
                            >
                              {r.desc}
                            </Text>
                          </View>
                          {selected && (
                            <View style={[styles.checkBadge, { backgroundColor: c.primary }]}>
                              <Text style={{ color: c.onPrimary, fontSize: 12 }}>✓</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {!!error && (
                    <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                      <Text style={[styles.errorText, { color: c.onErrorContainer }]}>{error}</Text>
                    </View>
                  )}

                  <Button
                    mode="contained"
                    onPress={goToStep2}
                    disabled={!role}
                    style={styles.btn}
                    contentStyle={styles.btnContent}
                    labelStyle={styles.btnLabel}
                  >
                    Continue
                  </Button>
                </Animated.View>
              )}

              {/* ── Step 2: Registration form ── */}
              {step === 2 && (
                <Animated.View entering={FadeInRight.duration(250)}>
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

                  <TextInput
                    label={
                      role === 'student' || role === 'faculty'
                        ? 'Email (christuniversity.in)'
                        : 'Email address'
                    }
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

                  <TextInput
                    label="Password (min. 8 chars)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
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

                  <TextInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
                    mode="outlined"
                    left={<TextInput.Icon icon="lock-check-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        onPress={() => setShowConfirmPassword((v) => !v)}
                      />
                    }
                    style={styles.input}
                    outlineStyle={{ borderRadius: radius.md }}
                  />

                  {role === 'student' && (
                    <TextInput
                      label="Register number *"
                      value={registerNumber}
                      onChangeText={setRegisterNumber}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      mode="outlined"
                      left={<TextInput.Icon icon="card-account-details-outline" />}
                      style={styles.input}
                      outlineStyle={{ borderRadius: radius.md }}
                    />
                  )}

                  {role === 'faculty' && (
                    <TextInput
                      label="Employee ID *"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      mode="outlined"
                      left={<TextInput.Icon icon="badge-account-outline" />}
                      style={styles.input}
                      outlineStyle={{ borderRadius: radius.md }}
                    />
                  )}

                  {role === 'store_employee' && (
                    <>
                      <TextInput
                        label="Employee ID *"
                        value={employeeId}
                        onChangeText={setEmployeeId}
                        autoCapitalize="characters"
                        returnKeyType="next"
                        mode="outlined"
                        left={<TextInput.Icon icon="badge-account-outline" />}
                        style={styles.input}
                        outlineStyle={{ borderRadius: radius.md }}
                      />
                      <TextInput
                        label="Phone number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        mode="outlined"
                        left={<TextInput.Icon icon="phone-outline" />}
                        style={styles.input}
                        outlineStyle={{ borderRadius: radius.md }}
                      />
                      <TextInput
                        label="Store name"
                        value={storeName}
                        onChangeText={setStoreName}
                        autoCapitalize="words"
                        returnKeyType="next"
                        mode="outlined"
                        left={<TextInput.Icon icon="store-outline" />}
                        style={styles.input}
                        outlineStyle={{ borderRadius: radius.md }}
                      />
                      <TextInput
                        label="Store UPI ID"
                        value={storeUpiId}
                        onChangeText={setStoreUpiId}
                        autoCapitalize="none"
                        placeholder="example@upi"
                        returnKeyType="done"
                        mode="outlined"
                        left={<TextInput.Icon icon="qrcode" />}
                        style={styles.input}
                        outlineStyle={{ borderRadius: radius.md }}
                      />
                    </>
                  )}

                  {!!error && (
                    <View style={[styles.errorBox, { backgroundColor: c.errorContainer }]}>
                      <Text style={[styles.errorText, { color: c.onErrorContainer }]}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.stepBtns}>
                    <Button
                      mode="outlined"
                      onPress={goBack}
                      style={[styles.btn, { flex: 1 }]}
                      contentStyle={styles.btnContent}
                      labelStyle={styles.btnLabel}
                    >
                      Back
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleRegister}
                      loading={loading}
                      disabled={loading}
                      style={[styles.btn, { flex: 2 }]}
                      contentStyle={styles.btnContent}
                      labelStyle={styles.btnLabel}
                    >
                      Create Account
                    </Button>
                  </View>
                </Animated.View>
              )}
            </Surface>
          </Animated.View>

          {/* Footer */}
          {step === 1 && (
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.loginRow}>
              <Text style={[styles.loginText, { color: c.onSurfaceVariant }]}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: c.primary }]}>Sign In</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -100,
    left: -100,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 80,
    right: -60,
  },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.base },
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
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: spacing.base },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  stepPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  stepConnector: { width: 24, height: 2, borderRadius: 1 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: spacing.xs },
  card: { borderRadius: radius.xl, padding: spacing.xl },
  roleList: { gap: spacing.sm, marginBottom: spacing.lg },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmoji: { fontSize: 24 },
  roleText: { flex: 1 },
  roleLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  roleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { marginBottom: spacing.md },
  errorBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  btn: { borderRadius: radius.lg },
  btnContent: { height: 52 },
  btnLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  stepBtns: { flexDirection: 'row', gap: spacing.sm },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
