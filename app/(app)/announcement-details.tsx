import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RideRequest {
  id: string;
  status: string;
  requested_at: string;
  passenger_id?: string;
  name?: string;
  phone?: string;
  isDemo?: boolean;
}

export default function AnnouncementDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [ride, setRide] = useState<any>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const demoRequests: RideRequest[] = [
    {
      id: 'demo-1',
      status: 'pending',
      requested_at: new Date().toISOString(),
      name: 'Rahul S',
      phone: '+91 98XXXXXX21',
      isDemo: true,
    },
    {
      id: 'demo-2',
      status: 'accepted',
      requested_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      name: 'Ayesha K',
      phone: '+91 97XXXXXX84',
      isDemo: true,
    },
  ];

  const fetchDetails = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id as string)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);

      const { data: reqData } = await supabase
        .from('ride_requests')
        .select('id,status,requested_at,passenger_id')
        .eq('ride_id', id as string)
        .order('requested_at', { ascending: false });

      const supabaseRequests = (reqData || []) as RideRequest[];
      setRequests([...supabaseRequests, ...demoRequests]);
    } catch (error) {
      console.error('Error loading announcement details:', error);
      Alert.alert('Error', 'Could not load announcement details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement Details</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <>
          {ride && (
            <View style={styles.rideCard}>
              <Text style={styles.rideTitle}>{ride.pickup_address} → {ride.dropoff_address}</Text>
              <View style={styles.rideMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
                  <Text style={styles.metaText}>{ride.ride_date || 'Date TBD'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
                  <Text style={styles.metaText}>{ride.ride_time || 'Time TBD'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={colors.gray[500]} />
                  <Text style={styles.metaText}>{ride.available_seats ?? 1} seats</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ride Requests</Text>
            <Text style={styles.sectionCount}>{requests.length}</Text>
          </View>

          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.emptyTitle}>No requests yet</Text>
                <Text style={styles.emptySubtitle}>You will see requests here as they arrive</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>
                    {item.name || `Passenger ${item.passenger_id?.slice(0, 6) || 'Unknown'}`}
                  </Text>
                  <Text style={styles.requestMeta}>
                    {item.phone || 'Phone hidden'} · {formatTime(item.requested_at)}
                  </Text>
                </View>
                <View style={[
                  styles.statusPill,
                  item.status === 'accepted' ? styles.statusAccepted : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  rideCard: {
    backgroundColor: colors.background.primary,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  rideMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  requestCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  requestMeta: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: colors.warning[100],
  },
  statusAccepted: {
    backgroundColor: colors.success[100],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
});
