import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { AuthProvider } from '@/contexts/AuthContext';
import { RideProvider } from '@/contexts/RideContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { VerificationProvider } from '@/contexts/VerificationContext';
import { MatchingProvider } from '@/contexts/MatchingContext';
import { SafetyProvider } from '@/contexts/SafetyContext';
import { EmergencyProvider } from '@/contexts/EmergencyContext';

export default function RootLayout() {
  // Screen capture prevention disabled for development/testing
  // In production, you might want to enable this for sensitive screens
  // if (Platform.OS !== 'web') {
  //   usePreventScreenCapture();
  // }
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VerificationProvider>
          <MatchingProvider>
            <SafetyProvider>
              <EmergencyProvider>
                <RideProvider>
                  <PaymentProvider>
                    <NotificationProvider>
                      <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(app)" options={{ headerShown: false }} />
                      </Stack>
                    </NotificationProvider>
                  </PaymentProvider>
                </RideProvider>
              </EmergencyProvider>
            </SafetyProvider>
          </MatchingProvider>
        </VerificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
