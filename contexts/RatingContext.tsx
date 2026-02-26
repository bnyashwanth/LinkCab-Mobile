import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import * as Sentry from '@sentry/react-native';

interface Rating {
  id: string;
  rater_id: string;
  rated_id: string;
  ride_id: string;
  rating: number; // 1-5
  feedback?: string;
  created_at: string;
}

interface UserRatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface RatingContextType {
  loading: boolean;
  submitRating: (ratedId: string, rideId: string, rating: number, feedback?: string) => Promise<{ error: any; success: boolean }>;
  getUserRatings: (userId: string) => Promise<{ error: any; data: Rating[] }>;
  getUserRatingStats: (userId: string) => Promise<{ error: any; data: UserRatingStats }>;
  getRideRatings: (rideId: string) => Promise<{ error: any; data: Rating[] }>;
  canRateUser: (userId: string, rideId: string) => boolean;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const useRating = () => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};

interface RatingProviderProps {
  children: React.ReactNode;
}

export const RatingProvider: React.FC<RatingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const submitRating = async (
    ratedId: string,
    rideId: string,
    rating: number,
    feedback?: string
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    if (rating < 1 || rating > 5) {
      return { error: new Error('Rating must be between 1 and 5'), success: false };
    }

    setLoading(true);
    try {
      // Check if user has already rated this person for this ride
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('*')
        .eq('rater_id', user.id)
        .eq('ratedId', ratedId)
        .eq('rideId', rideId)
        .single();

      if (existingRating) {
        return { error: new Error('You have already rated this user for this ride'), success: false };
      }

      // Submit the rating
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          rater_id: user.id,
          ratedId,
          rideId,
          rating,
          feedback,
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getUserRatings = async (userId: string): Promise<{ error: any; data: Rating[] }> => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('ratedId', userId)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: [] };
    }
  };

  const getUserRatingStats = async (userId: string): Promise<{ error: any; data: UserRatingStats }> => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('ratedId', userId);

      if (error) {
        Sentry.captureException(error);
        return { error, data: { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
      }

      const ratings = data || [];
      const totalRatings = ratings.length;

      if (totalRatings === 0) {
        return { error: null, data: { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
      }

      // Calculate average rating
      const averageRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings;

      // Calculate rating distribution
      const ratingDistribution = ratings.reduce((dist: any, r: any) => {
        dist[r.rating] = (dist[r.rating] || 0) + 1;
        return dist;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      return {
        error: null,
        data: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalRatings,
          ratingDistribution,
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } };
    }
  };

  const getRideRatings = async (rideId: string): Promise<{ error: any; data: Rating[] }> => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('rideId', rideId)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: [] };
    }
  };

  const canRateUser = (userId: string, rideId: string): boolean => {
    // User cannot rate themselves
    if (user?.id === userId) return false;
    
    // Additional logic could be added here:
    // - Check if user was part of this ride
    // - Check if ride is completed
    // - Check if user hasn't already rated
    
    return true; // For now, allow rating (you can add more checks later)
  };

  const value: RatingContextType = {
    loading,
    submitRating,
    getUserRatings,
    getUserRatingStats,
    getRideRatings,
    canRateUser,
  };

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
};
