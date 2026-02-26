import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Location as LocationType } from '@/types';
import { getCurrentLocation, requestLocationPermission } from "../lib/location";

export const useLocation = () => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setError('Unable to get current location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location error');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
      }
      return hasPermission;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission error');
      return false;
    }
  }, []);

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    location,
    loading,
    error,
    getCurrentPosition,
    requestPermission,
  };
};
