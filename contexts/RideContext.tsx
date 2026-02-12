import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RideContextType, Ride, Location } from '@/types';
import { useAuth } from './AuthContext';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRides();
      subscribeToRideUpdates();
    }
  }, [user]);

  const subscribeToRideUpdates = () => {
    const subscription = supabase
      .channel('rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `rider_id=eq.${user?.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCurrentRide(payload.new as Ride);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

      const { data, error } = await supabase
        .from('rides')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, data: null };
      }

      setCurrentRide(data);
      await fetchRides();
      return { error: null, data };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  };

  const requestRide = async (rideId: string): Promise<{ error: any }> => {
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

  const acceptRide = async (rideId: string): Promise<{ error: any }> => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: user.id,
          status: 'accepted',
        })
        .eq('id', rideId);

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
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .or(`rider_id.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

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

  const subscribeToRides = () => {
    if (!user) return () => { };

    const subscription = supabase
      .channel('rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `rider_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCurrentRide(payload.new as Ride);
            fetchRides(); // Refresh rides list
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const value: RideContextType = {
    rides,
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
    subscribeToRides,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};
