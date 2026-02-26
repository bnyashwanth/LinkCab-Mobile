import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The session should be automatically set by Supabase
        // Just wait a moment and then redirect
        setTimeout(() => {
          if (user) {
            router.replace('/(app)/home');
          } else {
            // If no user after callback, redirect to login with error
            router.replace({
              pathname: '/(auth)/login',
              params: { error: 'Authentication failed' }
            });
          }
        }, 1000);
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace({
          pathname: '/(auth)/login',
          params: { error: 'Authentication callback failed' }
        });
      }
    };

    handleCallback();
  }, [user, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ marginTop: 16, color: '#6B7280' }}>
        Completing authentication...
      </Text>
    </View>
  );
}
