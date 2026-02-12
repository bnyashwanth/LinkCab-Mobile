import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ride, Location } from '@/types';
import { useAuth } from './AuthContext';
import * as Sentry from '@sentry/react-native';

interface MatchScore {
  routeProximity: number;  // 40%
  timeCompatibility: number; // 25%
  preferenceMatch: number;  // 20%
  userRating: number;      // 15%
  totalScore: number;
}

interface MatchedRide extends Ride {
  matchScore: MatchScore;
  matchReasons: string[];
}

interface MatchingContextType {
  matchedRides: MatchedRide[];
  loading: boolean;
  findMatches: (userLocation?: Location, preferences?: MatchingPreferences) => Promise<void>;
  getMatchScore: (ride: Ride, userLocation?: Location, preferences?: MatchingPreferences) => MatchScore;
  getRecommendations: (limit?: number) => MatchedRide[];
}

interface MatchingPreferences {
  maxDistance?: number; // in km
  maxTimeDifference?: number; // in hours
  preferredGender?: 'male' | 'female' | 'any';
  preferredVehicleType?: string[];
  minRating?: number;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};

interface MatchingProviderProps {
  children: React.ReactNode;
}

export const MatchingProvider: React.FC<MatchingProviderProps> = ({ children }) => {
  const [matchedRides, setMatchedRides] = useState<MatchedRide[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate route proximity score
  const calculateRouteProximity = (ride: Ride, userLocation?: Location): number => {
    if (!userLocation) return 0.5; // Default score if no user location

    const pickupDistance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      ride.pickup_latitude,
      ride.pickup_longitude
    );

    const dropoffDistance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      ride.dropoff_latitude,
      ride.dropoff_longitude
    );

    // Score based on how close the route is to user
    // Lower distance = higher score
    const avgDistance = (pickupDistance + dropoffDistance) / 2;
    const maxScoreDistance = 10; // km
    
    if (avgDistance <= maxScoreDistance) {
      return 1 - (avgDistance / maxScoreDistance);
    }
    
    return Math.max(0.1, 1 - (avgDistance / maxScoreDistance) * 0.5);
  };

  // Calculate time compatibility score
  const calculateTimeCompatibility = (ride: Ride): number => {
    if (!ride.ride_date || !ride.ride_time) return 0.5;

    const rideDateTime = new Date(`${ride.ride_date} ${ride.ride_time}`);
    const now = new Date();
    const timeDiff = Math.abs(rideDateTime.getTime() - now.getTime()) / (1000 * 60 * 60); // hours

    // Optimal time window: 1-24 hours from now
    if (timeDiff <= 1) return 0.8; // Very soon
    if (timeDiff <= 24) return 1.0; // Optimal
    if (timeDiff <= 48) return 0.7; // Acceptable
    if (timeDiff <= 72) return 0.5; // Less ideal
    return 0.3; // Too far in future/past
  };

  // Calculate preference match score
  const calculatePreferenceMatch = (ride: Ride, preferences?: MatchingPreferences): number => {
    let score = 1.0;
    let factors = 0;

    // Gender preference
    if (preferences?.preferredGender && preferences.preferredGender !== 'any') {
      factors++;
      if (ride.gender_preference === preferences.preferredGender || ride.gender_preference === 'any') {
        score *= 1.0;
      } else {
        score *= 0.3; // Strong penalty for gender mismatch
      }
    }

    // Vehicle type preference
    if (preferences?.preferredVehicleType && preferences.preferredVehicleType.length > 0) {
      factors++;
      if (preferences.preferredVehicleType.includes(ride.cab_type || 'sedan')) {
        score *= 1.0;
      } else {
        score *= 0.7; // Mild penalty for vehicle type mismatch
      }
    }

    // Rating preference
    if (preferences?.minRating) {
      factors++;
      const rideRating = (ride as any).user?.rating || 0;
      if (rideRating >= preferences.minRating) {
        score *= 1.0;
      } else {
        score *= 0.5; // Penalty for low rating
      }
    }

    return factors > 0 ? score : 0.8; // Default if no preferences specified
  };

  // Calculate user rating score
  const calculateUserRatingScore = (ride: Ride): number => {
    const rating = (ride as any).user?.rating || 0;
    
    if (rating >= 4.5) return 1.0;
    if (rating >= 4.0) return 0.8;
    if (rating >= 3.5) return 0.6;
    if (rating >= 3.0) return 0.4;
    if (rating > 0) return 0.2;
    return 0.5; // Default for new users
  };

  // Generate match reasons
  const generateMatchReasons = (matchScore: MatchScore): string[] => {
    const reasons: string[] = [];

    if (matchScore.routeProximity >= 0.8) {
      reasons.push('Very close to your location');
    } else if (matchScore.routeProximity >= 0.6) {
      reasons.push('Nearby route');
    }

    if (matchScore.timeCompatibility >= 0.8) {
      reasons.push('Perfect timing');
    } else if (matchScore.timeCompatibility >= 0.6) {
      reasons.push('Good timing');
    }

    if (matchScore.preferenceMatch >= 0.8) {
      reasons.push('Matches your preferences');
    }

    if (matchScore.userRating >= 0.8) {
      reasons.push('Highly rated driver');
    }

    if (reasons.length === 0) {
      reasons.push('Available ride');
    }

    return reasons.slice(0, 3); // Max 3 reasons
  };

  // Calculate overall match score
  const getMatchScore = (ride: Ride, userLocation?: Location, preferences?: MatchingPreferences): MatchScore => {
    const routeProximity = calculateRouteProximity(ride, userLocation);
    const timeCompatibility = calculateTimeCompatibility(ride);
    const preferenceMatch = calculatePreferenceMatch(ride, preferences);
    const userRating = calculateUserRatingScore(ride);

    // Weighted average
    const totalScore = 
      (routeProximity * 0.40) +
      (timeCompatibility * 0.25) +
      (preferenceMatch * 0.20) +
      (userRating * 0.15);

    return {
      routeProximity,
      timeCompatibility,
      preferenceMatch,
      userRating,
      totalScore,
    };
  };

  // Find matches for available rides
  const findMatches = async (userLocation?: Location, preferences?: MatchingPreferences) => {
    setLoading(true);
    try {
      // This would typically fetch from your API/database
      // For now, we'll simulate with existing rides
      // In a real implementation, you'd fetch rides that match user criteria
      
      // Mock fetch of available rides
      const availableRides: Ride[] = []; // This would come from your API
      
      // Calculate match scores for each ride
      const matched: MatchedRide[] = availableRides
        .filter(ride => ride.status === 'pending' || ride.status === 'active')
        .map(ride => {
          const matchScore = getMatchScore(ride, userLocation, preferences);
          const matchReasons = generateMatchReasons(matchScore);
          
          return {
            ...ride,
            matchScore,
            matchReasons,
          };
        })
        .sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore); // Sort by best match

      setMatchedRides(matched);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get top recommendations
  const getRecommendations = (limit: number = 5): MatchedRide[] => {
    return matchedRides.slice(0, limit);
  };

  const value: MatchingContextType = {
    matchedRides,
    loading,
    findMatches,
    getMatchScore,
    getRecommendations,
  };

  return <MatchingContext.Provider value={value}>{children}</MatchingContext.Provider>;
};
