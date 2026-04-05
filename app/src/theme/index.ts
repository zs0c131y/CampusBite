import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme, configureFonts } from 'react-native-paper';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme } from '@react-navigation/native';
import type { MD3Theme } from 'react-native-paper';

// Warm orange M3 seed palette — matches web design system
const lightColors = {
  primary: '#C56200',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFDCC2',
  onPrimaryContainer: '#371D00',
  secondary: '#755945',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDCC6',
  onSecondaryContainer: '#2C160C',
  tertiary: '#5D6024',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#E2E64A',
  onTertiaryContainer: '#1B1D00',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFF8F4',
  onBackground: '#201A17',
  surface: '#FFF8F4',
  onSurface: '#201A17',
  surfaceVariant: '#F4DED2',
  onSurfaceVariant: '#53433C',
  outline: '#85736B',
  outlineVariant: '#D7C3BB',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#362F2C',
  inverseOnSurface: '#FBEEEA',
  inversePrimary: '#FFB77C',
  surfaceDisabled: 'rgba(32,26,23,0.12)',
  onSurfaceDisabled: 'rgba(32,26,23,0.38)',
  backdrop: 'rgba(56,45,38,0.4)',
  elevation: {
    level0: 'transparent',
    level1: '#FFF1EA',
    level2: '#FBEBDF',
    level3: '#F5E5D8',
    level4: '#F3E3D5',
    level5: '#EFE0D2',
  },
};

const darkColors = {
  primary: '#FFB77C',
  onPrimary: '#5B2E00',
  primaryContainer: '#7F4000',
  onPrimaryContainer: '#FFDCC2',
  secondary: '#DFBDA4',
  onSecondary: '#432B1A',
  secondaryContainer: '#5C412E',
  onSecondaryContainer: '#FFDCC6',
  tertiary: '#C6C94F',
  onTertiary: '#2F3200',
  tertiaryContainer: '#454800',
  onTertiaryContainer: '#E2E64A',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1A1210',
  onBackground: '#EFE0D2',
  surface: '#1A1210',
  onSurface: '#EFE0D2',
  surfaceVariant: '#53433C',
  onSurfaceVariant: '#D7C3BB',
  outline: '#A08D85',
  outlineVariant: '#53433C',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#EFE0D2',
  inverseOnSurface: '#362F2C',
  inversePrimary: '#C56200',
  surfaceDisabled: 'rgba(239,224,210,0.12)',
  onSurfaceDisabled: 'rgba(239,224,210,0.38)',
  backdrop: 'rgba(56,45,38,0.4)',
  elevation: {
    level0: 'transparent',
    level1: '#2A1E1B',
    level2: '#2F2220',
    level3: '#342724',
    level4: '#352927',
    level5: '#392D2A',
  },
};

export function buildTheme(dynamicTheme?: Partial<typeof lightColors>, fontsReady = false): MD3Theme {
  // On Android 12+ we get dynamic colors from the wallpaper; fall back to our seed
  const colors = {
    ...lightColors,
    ...(dynamicTheme ?? {}),
  };

  return {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...colors,
    },
    roundness: 4, // M3 extra-large = 28dp; Paper uses roundness multiplier (28/7 ≈ 4)
    fonts: fontsReady
      ? configureFonts({
          config: {
            displayLarge:   { fontFamily: 'Inter_700Bold' },
            displayMedium:  { fontFamily: 'Inter_700Bold' },
            displaySmall:   { fontFamily: 'Inter_700Bold' },
            headlineLarge:  { fontFamily: 'Inter_700Bold' },
            headlineMedium: { fontFamily: 'Inter_600SemiBold' },
            headlineSmall:  { fontFamily: 'Inter_600SemiBold' },
            titleLarge:     { fontFamily: 'Inter_600SemiBold' },
            titleMedium:    { fontFamily: 'Inter_600SemiBold' },
            titleSmall:     { fontFamily: 'Inter_500Medium' },
            bodyLarge:      { fontFamily: 'Inter_400Regular' },
            bodyMedium:     { fontFamily: 'Inter_400Regular' },
            bodySmall:      { fontFamily: 'Inter_400Regular' },
            labelLarge:     { fontFamily: 'Inter_500Medium' },
            labelMedium:    { fontFamily: 'Inter_500Medium' },
            labelSmall:     { fontFamily: 'Inter_400Regular' },
          },
        })
      : MD3LightTheme.fonts,
  };
}

export function buildDarkTheme(dynamicTheme?: Partial<typeof darkColors>): MD3Theme {
  const colors = {
    ...darkColors,
    ...(dynamicTheme ?? {}),
  };
  return {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...colors,
    },
    roundness: 4,
  };
}

export function navigationTheme(paperTheme: MD3Theme) {
  const { LightTheme } = adaptNavigationTheme({
    reactNavigationLight: NavLightTheme,
    materialLight: paperTheme,
  });
  return LightTheme;
}

// Convenience color ref for StyleSheet.create use
export const colors = lightColors;

// Spacing scale (8dp grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border radius (M3 shape scale)
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 9999,
};

// Typography sizes
export const type = {
  displayLarge: 57,
  displayMedium: 45,
  displaySmall: 36,
  headlineLarge: 32,
  headlineMedium: 28,
  headlineSmall: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
};
