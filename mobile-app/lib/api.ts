import { supabase } from './supabase';
import { Ride, RideRequest, Profile } from '@/types';

export const fetchUserRides = async (userId: string) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .or(`rider_id.eq.${userId},driver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const fetchAllAvailableRides = async (userId: string) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .neq('rider_id', userId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });
  return { data, error };
};

export const fetchRideRequests = async (rideId: string) => {
  const { data: requests, error: reqError } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: false });

  if (reqError) return { data: [], error: reqError };

  // Fetch passenger profiles in one query to avoid missing FK relationship
  const passengerIds = Array.from(new Set((requests || []).map((r: any) => r.passenger_id))).filter(Boolean);
  let profiles: any[] = [];
  if (passengerIds.length > 0) {
    const { data: pData, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, verification_status')
      .in('id', passengerIds);
    if (!pError && pData) profiles = pData;
  }

  // attach passenger profile to each request
  const enriched = (requests || []).map((r: any) => ({
    ...r,
    passenger: profiles.find(p => p.id === r.passenger_id) || null,
  }));

  return { data: enriched, error: null };
};

// Fetch all ride requests for rides owned by a specific user (owner)
export const fetchRideRequestsForMyRides = async (ownerId: string) => {
  // first get all ride ids owned by the user
  const { data: rides, error: ridesError } = await supabase
    .from('rides')
    .select('id')
    .eq('rider_id', ownerId);

  if (ridesError) {
    return { data: [], error: ridesError };
  }

  const rideIds = (rides || []).map((r: any) => r.id);
  if (rideIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: requests, error: reqError } = await supabase
    .from('ride_requests')
    .select('*')
    .in('ride_id', rideIds)
    .order('created_at', { ascending: false });

  if (reqError) return { data: [], error: reqError };

  // fetch passenger profiles
  const passengerIds = Array.from(new Set((requests || []).map((r: any) => r.passenger_id))).filter(Boolean);
  let profiles: any[] = [];
  if (passengerIds.length > 0) {
    const { data: pData, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, verification_status')
      .in('id', passengerIds);
    if (!pError && pData) profiles = pData;
  }

  // fetch rides data for mapping
  const rideIdsUnique = Array.from(new Set((requests || []).map((r: any) => r.ride_id))).filter(Boolean);
  let ridesData: any[] = [];
  if (rideIdsUnique.length > 0) {
    const { data: rData, error: rError } = await supabase
      .from('rides')
      .select('*')
      .in('id', rideIdsUnique);
    if (!rError && rData) ridesData = rData;
  }

  const enriched = (requests || []).map((r: any) => ({
    ...r,
    passenger: profiles.find(p => p.id === r.passenger_id) || null,
    ride: ridesData.find(rd => rd.id === r.ride_id) || null,
  }));

  return { data: enriched, error: null };
};

export const updateRideRequestStatus = async (requestId: string, status: string) => {
  const { data, error } = await supabase
    .from('ride_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId);
  return { data, error };
};

export const createRide = async (ridePayload: any) => {
  const { data, error } = await supabase
    .from('rides')
    .insert(ridePayload)
    .select()
    .single();
  return { data, error };
};

// more helpers can be added as needed
