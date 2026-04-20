import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider, Theme } from 'tamagui';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import tamaguiConfig from '@/theme/tamagui.config';
import i18n, { initLanguage } from '@/i18n';
import { useSettingsStore } from '@/store';
import { useDeepLinkHandler } from '@/hooks/useDeepLinkHandler';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation(['nav', 'common']);

  useDeepLinkHandler();

  useEffect(() => {
    initLanguage(language);
  }, [language]);

  return (
    <I18nextProvider i18n={i18n}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="record" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="text" options={{ headerShown: false }} />
          <Stack.Screen name="attachment" options={{ headerShown: false }} />
          <Stack.Screen
            name="note/[id]"
            options={{
              headerShown: true,
              headerTitle: t('nav:note'),
              headerBackTitle: t('common:back'),
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="recording/[id]"
            options={{
              headerShown: true,
              headerTitle: t('nav:recording'),
              headerBackTitle: t('common:back'),
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="settings/models"
            options={{
              headerShown: true,
              headerTitle: t('nav:models'),
              headerBackTitle: t('common:back'),
              presentation: 'card',
            }}
          />
        </Stack>
      </Theme>
    </TamaguiProvider>
    </I18nextProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
