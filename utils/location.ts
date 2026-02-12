import * as Location from 'expo-location';
import { Location as LocationType } from '@/types';

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationType | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: 'Current Location', // You would geocode this in a real app
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export const calculateFare = (
  distance: number,
  duration: number,
  baseFare: number = 50,
  perKmRate: number = 15,
  perMinuteRate: number = 2
): number => {
  const distanceFare = distance * perKmRate;
  const timeFare = (duration / 60) * perMinuteRate; // Convert duration to minutes
  return baseFare + distanceFare + timeFare;
};

export const geocodeAddress = async (address: string): Promise<LocationType | null> => {
  try {
    // In a real app, you would use Google Maps Geocoding API
    // For now, return a mock location
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // In a real app, you would use Google Maps Reverse Geocoding API
    // For now, return a mock address
    return 'Delhi, India';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Unknown Location';
  }
};
