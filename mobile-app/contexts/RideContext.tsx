import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";
import { RideContextType, Ride, Location, RideRequest } from '@/types';
import * as api from "../lib/api";
import { useAuth } from './AuthContext';
// explicitly import as default in case named export isn't available during bundling
import { useSupabaseSubscription } from '@/hooks/useSupabaseSubscription';

import * as Sentry from '@sentry/react-native';

const RideContext = createContext<RideContextType | undefined>(undefined);

export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

interface RideProviderProps {
  children: React.ReactNode;
}

export const RideProvider: React.FC<RideProviderProps> = ({ children }) => {
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRides();
      fetchAllRides();
    }
  }, [user]);

  // subscribe to changes for current user's rides
  useSupabaseSubscription(
    'rides-user',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `rider_id=eq.${user?.id}`,
    },
    (payload: any) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setCurrentRide(payload.new as Ride);
        fetchRides();
      }
    }
  );

  // legacy function retained for API compatibility; uses subscription hook internally
  const subscribeToRideUpdates = () => {
    // nothing to do; hook already sets up subscription automatically
    return () => {};
  };

  const createRide = async (
    input:
      | { pickup: Location; dropoff: Location }
      | {
        pickup_location: { latitude: number; longitude: number; address: string };
        dropoff_location: { latitude: number; longitude: number; address: string };
        estimated_fare?: number;
        ride_date?: string;
        ride_time?: string;
        available_seats?: number;
        cab_type?: string;
        gender_preference?: string;
        notes?: string;
        booking_app?: 'uber' | 'ola' | 'rapido' | 'other';
        note_photo_urls?: string[];
        creator_small_bags?: number;
        creator_medium_bags?: number;
        creator_large_bags?: number;
      }
  ): Promise<{ error: any; data: Ride | null }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: null };
    }

    const pickup =
      'pickup' in input ? input.pickup : input.pickup_location;
    const dropoff =
      'dropoff' in input ? input.dropoff : input.dropoff_location;
    const estimatedFare =
      'estimated_fare' in input ? input.estimated_fare ?? 0 : 0;

    setLoading(true);
    try {
      const insertData: Record<string, unknown> = {
        rider_id: user.id,
        pickup_latitude: pickup.latitude,
        pickup_longitude: pickup.longitude,
        pickup_address: pickup.address,
        dropoff_latitude: dropoff.latitude,
        dropoff_longitude: dropoff.longitude,
        dropoff_address: dropoff.address,
        status: 'pending',
        fare: estimatedFare,
        currency: 'INR',
        payment_method: 'razorpay',
        payment_status: 'pending',
      };

      if ('ride_date' in input && input.ride_date) {
        insertData.ride_date = input.ride_date;
      }
      if ('ride_time' in input && input.ride_time) {
        insertData.ride_time = input.ride_time;
      }
      if ('available_seats' in input && input.available_seats != null) {
        insertData.available_seats = input.available_seats;
      }
      if ('cab_type' in input && input.cab_type) {
        insertData.cab_type = input.cab_type;
      }
      if ('gender_preference' in input && input.gender_preference) {
        insertData.gender_preference = input.gender_preference;
      }
      if ('notes' in input && input.notes) {
        insertData.notes = input.notes;
      }
      if ('booking_app' in input && input.booking_app) {
        insertData.booking_app = input.booking_app;
      }
      if ('note_photo_urls' in input && input.note_photo_urls) {
        insertData.note_photo_urls = input.note_photo_urls;
      }
      if ('creator_small_bags' in input) {
        insertData.creator_small_bags = input.creator_small_bags ?? 0;
      }
      if ('creator_medium_bags' in input) {
        insertData.creator_medium_bags = input.creator_medium_bags ?? 0;
      }
      if ('creator_large_bags' in input) {
        insertData.creator_large_bags = input.creator_large_bags ?? 0;
      }

      const { data, error } = await api.createRide(insertData);

      if (error) {
        Sentry.captureException(error);
        return { error, data: null };
      }

      setCurrentRide(data as Ride);
      await fetchRides();
      return { error: null, data };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  };

  const requestRide = async (
    rideId: string,
    options?: { small_bags?: number; medium_bags?: number; large_bags?: number }
  ): Promise<{ error: any }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('ride_requests')
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          status: 'pending',
          requested_at: new Date().toISOString(),
          small_bags: options?.small_bags ?? 0,
          medium_bags: options?.medium_bags ?? 0,
          large_bags: options?.large_bags ?? 0,
        })
        .select();

      if (error) {
        Sentry.captureException(error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  // -------------------------------------------------------------------------
  // New helpers for owners to view/respond to requests
  // -------------------------------------------------------------------------
  const fetchRideRequests = async (rideId: string): Promise<{ error: any; data: any[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select(
          `*, passenger:profiles(id, full_name, avatar_url, verification_status)`
        )
        .eq('ride_id', rideId)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (e) {
      Sentry.captureException(e);
      return { error: e, data: [] };
    }
  };

  const respondToRideRequest = async (
    requestId: string,
    accept: boolean
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    try {
      const status = accept ? 'accepted' : 'rejected';
      const { data, error } = await supabase
        .from('ride_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      // if the owner accepted the request we may want to mark the ride booked
      if (accept && data?.ride_id) {
        await supabase
          .from('rides')
          .update({ status: 'booked' })
          .eq('id', data.ride_id);
      }

      return { error: null, success: true };
    } catch (e) {
      Sentry.captureException(e);
      return { error: e, success: false };
    }
  };

  const acceptRide = async (rideId: string): Promise<{ error: any }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // First check if the ride exists and is in pending status
      const { data: rideData, error: fetchError } = await supabase
        .from('rides')
        .select('id, status, rider_id, driver_id')
        .eq('id', rideId)
        .single();

      if (fetchError) {
        console.error('Fetch Error:', fetchError);
        Sentry.captureException(fetchError);
        return { error: fetchError };
      }

      if (!rideData) {
        return { error: new Error('Ride not found') };
      }

      if (rideData.status !== 'pending') {
        return { error: new Error('Ride is no longer available') };
      }

      if (rideData.driver_id) {
        return { error: new Error('Ride already has a driver') };
      }

      // Check if user exists in auth.users by trying to query their profile
      const { data: authUser, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser.user) {
        console.error('Auth Error:', authError);
        return { error: new Error('User authentication failed') };
      }

      console.log('Attempting to update ride:', {
        rideId,
        driverId: authUser.user.id,
        currentStatus: rideData.status
      });

      // Now update the ride with driver_id (directly from auth.users)
      const { data: updateData, error: updateError } = await supabase
        .from('rides')
        .update({
          driver_id: authUser.user.id,
          status: 'accepted',
        })
        .eq('id', rideId)
        .select();

      if (updateError) {
        console.error('Foreign Key Error Details:', {
          rideId,
          userId: authUser.user.id,
          error: updateError,
          errorCode: updateError.code,
          errorDetails: updateError.details,
          errorHint: updateError.hint,
          message: updateError.message
        });
        Sentry.captureException(updateError);
        return { error: updateError };
      }

      console.log('Ride updated successfully:', updateData);
      return { error: null };
    } catch (error) {
      console.error('Unexpected Error:', error);
      Sentry.captureException(error);
      return { error };
    }
  };

  const completeRide = async (rideId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
        })
        .eq('id', rideId);

      if (error) {
        Sentry.captureException(error);
        return { error };
      }

      setCurrentRide(null);
      return { error: null };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const cancelRide = async (rideId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
        })
        .eq('id', rideId);

      if (error) {
        Sentry.captureException(error);
        return { error };
      }

      setCurrentRide(null);
      return { error: null };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const rejectRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);

      if (error) {
        Sentry.captureException(error);
        setError(error.message);
        return;
      }

      await fetchRides();
    } catch (error: any) {
      Sentry.captureException(error);
      setError(error?.message ?? 'Unknown error');
    }
  };

  const fetchRides = async () => {
    if (!user) {
      setRides([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.fetchUserRides(user.id);

      if (error) {
        Sentry.captureException(error);
        setError(error.message);
        setRides([]);
      } else {
        setRides(data || []);
      }
    } catch (error: any) {
      Sentry.captureException(error);
      setError(error?.message ?? 'Unknown error');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const getRideHistory = async (): Promise<{ error: any; data: Ride[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .or(`rider_id.eq.${user.id},driver_id.eq.${user.id}`)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (error: any) {
      Sentry.captureException(error);
      setError(error?.message ?? 'Unknown error');
      return { error, data: [] };
    }
  };

  // previously exposed subscription helper
  const subscribeToRides = subscribeToRideUpdates;

  const deleteAllRides = async (): Promise<{ error: any }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // First, get all ride IDs owned by this user
      const { data: userRides, error: fetchError } = await supabase
        .from('rides')
        .select('id')
        .eq('rider_id', user.id);

      if (fetchError) {
        Sentry.captureException(fetchError);
        return { error: fetchError };
      }

      if (userRides && userRides.length > 0) {
        const rideIds = userRides.map((r: { id: string }) => r.id);

        // Delete associated ride_requests first (FK constraint)
        await supabase
          .from('ride_requests')
          .delete()
          .in('ride_id', rideIds);

        // Now delete the user's rides
        const { error } = await supabase
          .from('rides')
          .delete()
          .eq('rider_id', user.id);

        if (error) {
          Sentry.captureException(error);
          return { error };
        }
      }

      // Clear local state
      setRides([]);
      setCurrentRide(null);

      return { error: null };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  // Fetch all available rides from OTHER users (for discovery)
  const fetchAllRides = async () => {
    if (!user) {
      setAllRides([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .neq('rider_id', user.id)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        setAllRides([]);
        return;
      }

      if (!data || data.length === 0) {
        setAllRides([]);
        return;
      }

      // Fetch profile names for all ride creators
      const riderIds = [...new Set(data.map((r: any) => r.rider_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', riderIds);

      // Build a map of rider_id -> display name
      const profileMap: Record<string, string> = {};
      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.full_name) {
            profileMap[p.id] = p.full_name;
          } else if (p.email) {
            // Extract username from email (part before @)
            const username = p.email.split('@')[0];
            // Capitalize first letter and make it more readable
            profileMap[p.id] = username.charAt(0).toUpperCase() + username.slice(1).replace(/[\._]/g, ' ');
          } else {
            profileMap[p.id] = 'LinkCab User';
          }
        });
      }

      // Attach user info to each ride
      const ridesWithUsers = data.map((ride: any) => ({
        ...ride,
        user: {
          name: profileMap[ride.rider_id] || 'Anonymous User',
          rating: 4.5,
          verified: true,
        },
      }));

      setAllRides(ridesWithUsers);
    } catch (error) {
      Sentry.captureException(error);
      setAllRides([]);
    }
  };

  const value: RideContextType = {
    rides,
    allRides,
    currentRide,
    loading,
    error,
    createRide,
    requestRide,
    acceptRide,
    completeRide,
    cancelRide,
    rejectRide,
    fetchRides,
    fetchAllRides,
    getRideHistory,
    subscribeToRides,
    deleteAllRides,
    // new helpers
    fetchRideRequests,
    respondToRideRequest,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};
