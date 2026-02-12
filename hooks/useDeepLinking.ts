import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export const useDeepLinking = () => {
  const router = useRouter();

  useEffect(() => {
    // For now, we'll use a simpler approach
    // The deep linking will be handled by Expo Router automatically
    console.log('Deep linking hook initialized');
  }, [router]);
};
