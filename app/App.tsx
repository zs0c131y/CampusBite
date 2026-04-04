import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { RootNavigator } from '@/navigation';
import { buildTheme, navigationTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { theme: dynamicTheme } = useMaterial3Theme({ fallbackSourceColor: '#C56200' });
  const paperTheme = buildTheme(dynamicTheme);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navigationTheme(paperTheme)}>
            <AuthProvider>
              <CartProvider>
                <RootNavigator />
                <StatusBar style="auto" />
              </CartProvider>
            </AuthProvider>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
