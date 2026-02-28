import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRide } from '../../contexts/RideContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Ride, RideRequest } from '../../types';

export default function AnnouncementDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { rides, allRides, fetchRideRequests, respondToRideRequest } = useRide();

  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwner = useMemo(() => !!(ride && user && ride.rider_id === user.id), [ride, user]);

  useEffect(() => {
    const target = rides.find(r => r.id === id) || allRides.find(r => r.id === id);
    setRide(target || null);
    if (target) {
      loadRequests(target.id);
    }
    setLoading(false);
  }, [id, rides, allRides]);

  const loadRequests = async (rideId: string) => {
    const { data, error } = await fetchRideRequests(rideId);
    if (!error) {
      setRequests(data || []);
    }
  };

  const handleDecision = async (requestId: string, accept: boolean) => {
    if (!ride) return;
    setActionLoading(true);
    const { error, success } = await respondToRideRequest(requestId, accept);
    setActionLoading(false);

    if (error || !success) {
      Alert.alert('Error', `Unable to ${accept ? 'accept' : 'reject'} request.`);
      return;
    }

    await loadRequests(ride.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>Announcement not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnPlain}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement Details</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Route</Text>
          <Text style={styles.routeText}>{ride.pickup_address}</Text>
          <Text style={styles.routeArrow}>to</Text>
          <Text style={styles.routeText}>{ride.dropoff_address}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{ride.ride_date || 'Date TBD'}</Text>
            <Text style={styles.metaText}>{ride.ride_time || 'Time TBD'}</Text>
            <Text style={styles.metaText}>{ride.available_seats || 1} seats</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Creator Baggage</Text>
          <Text style={styles.metaText}>Small: {ride.creator_small_bags || 0}  Medium: {ride.creator_medium_bags || 0}  Large: {ride.creator_large_bags || 0}</Text>
        </View>

        {!!ride.note_photo_urls?.length && (
          <View style={styles.card}>
            <Text style={styles.label}>Note Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {ride.note_photo_urls.map((url, idx) => (
                <Image key={`${url}-${idx}`} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Ride Requests</Text>
          {!isOwner && <Text style={styles.metaText}>Only the ride creator can manage requests.</Text>}
          {isOwner && requests.length === 0 && <Text style={styles.metaText}>No requests yet.</Text>}

          {isOwner && requests.map(req => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestRow}>
                <Text style={styles.requestName}>{req.passenger?.full_name || 'Unknown user'}</Text>
                <Text style={styles.requestStatus}>{req.status}</Text>
              </View>

              <Text style={styles.metaText}>Bags: Small {req.small_bags || 0}, Medium {req.medium_bags || 0}, Large {req.large_bags || 0}</Text>

              {req.status === 'pending' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn, actionLoading && styles.actionDisabled]}
                    disabled={actionLoading}
                    onPress={() => handleDecision(req.id, true)}
                  >
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn, actionLoading && styles.actionDisabled]}
                    disabled={actionLoading}
                    onPress={() => handleDecision(req.id, false)}
                  >
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  routeText: { fontSize: 15, color: '#111827', fontWeight: '700' },
  routeArrow: { fontSize: 12, color: '#6B7280', marginVertical: 3 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: '#4B5563' },
  photoRow: { gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#E5E7EB' },
  requestCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  requestName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  requestStatus: { fontSize: 12, fontWeight: '700', color: '#111827' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#16A34A' },
  rejectBtn: { backgroundColor: '#DC2626' },
  actionText: { color: '#fff', fontWeight: '700' },
  actionDisabled: { opacity: 0.6 },
  notFound: { color: '#111827', fontWeight: '700', marginBottom: 12 },
  backBtnPlain: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
