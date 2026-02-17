import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RideRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | string;
  requested_at: string;
  responded_at?: string | null;
  passenger_id?: string;
  name?: string;
  phone?: string;
  small_bags?: number;
  medium_bags?: number;
  large_bags?: number;
}

export default function AnnouncementDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [ride, setRide] = useState<any>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

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

      const { data: reqData, error: reqError } = await supabase
        .from('ride_requests')
        .select('id,status,requested_at,responded_at,passenger_id,small_bags,medium_bags,large_bags')
        .eq('ride_id', id as string)
        .order('requested_at', { ascending: false });

      if (reqError) throw reqError;

      const mappedRequests = (reqData || []) as RideRequest[];
      const passengerIds = Array.from(
        new Set(mappedRequests.map((req) => req.passenger_id).filter(Boolean))
      ) as string[];

      let profileById: Record<string, { full_name?: string | null; phone?: string | null }> = {};
      if (passengerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id,full_name,phone')
          .in('id', passengerIds);

        profileById = (profilesData || []).reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      setRequests(
        mappedRequests.map((request) => ({
          ...request,
          name: profileById[request.passenger_id || '']?.full_name || undefined,
          phone: profileById[request.passenger_id || '']?.phone || undefined,
        }))
      );
    } catch (error) {
      console.error('Error loading announcement details:', error);
      Alert.alert('Error', 'Could not load announcement details');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: 'accepted' | 'rejected'
  ) => {
    setActionLoadingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (status === 'accepted') {
        await supabase
          .from('rides')
          .update({ status: 'accepted' })
          .eq('id', id as string)
          .eq('status', 'pending');
      }

      await fetchDetails();
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update this request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    if (status === 'accepted') {
      return styles.statusAccepted;
    }
    if (status === 'rejected') {
      return styles.statusRejected;
    }
    return styles.statusPending;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={styles.listFooter} />}
          ListHeaderComponent={
            ride ? (
              <View style={styles.rideCard}>
                <Text style={styles.rideTitle}>{ride.pickup_address} to {ride.dropoff_address}</Text>
                <View style={styles.rideMetaRow}>
                  <Text style={styles.metaText}>{ride.ride_date || 'Date TBD'}</Text>
                  <Text style={styles.metaText}>{ride.ride_time || 'Time TBD'}</Text>
                  <Text style={styles.metaText}>{ride.available_seats ?? 1} seats</Text>
                </View>
                <View style={styles.rideMetaRow}>
                  <Text style={styles.metaText}>Fare: INR {ride.fare ?? ride.estimated_fare ?? '--'}</Text>
                  {ride.booking_app ? <Text style={styles.metaText}>Booked via {ride.booking_app}</Text> : null}
                </View>

                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Your Luggage</Text>
                  <View style={styles.chipsRow}>
                    <Text style={styles.chip}>Small {ride.creator_small_bags ?? 0}</Text>
                    <Text style={styles.chip}>Medium {ride.creator_medium_bags ?? 0}</Text>
                    <Text style={styles.chip}>Large {ride.creator_large_bags ?? 0}</Text>
                  </View>
                </View>

                {(ride.notes || (ride.note_photo_urls && ride.note_photo_urls.length > 0)) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subTitle}>Notes</Text>
                    {ride.notes ? <Text style={styles.notesText}>{ride.notes}</Text> : null}
                    {ride.note_photo_urls && ride.note_photo_urls.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                        {ride.note_photo_urls.map((url: string) => (
                          <Image key={url} source={{ uri: url }} style={styles.noteImage} />
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Requests</Text>
                  <Text style={styles.sectionCount}>{requests.length}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.gray[400]} />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptySubtitle}>You will see requests here as they arrive</Text>
            </View>
          }
          renderItem={({ item }) => {
            const small = item.small_bags ?? 0;
            const medium = item.medium_bags ?? 0;
            const large = item.large_bags ?? 0;
            return (
              <View style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {item.name || `Passenger ${item.passenger_id?.slice(0, 6) || 'Unknown'}`}
                    </Text>
                    <Text style={styles.requestMeta}>
                      {item.phone || 'Phone hidden'} | {formatTime(item.requested_at)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, getStatusStyle(item.status)]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.chipsRow}>
                  <Text style={styles.chip}>Small {small}</Text>
                  <Text style={styles.chip}>Medium {medium}</Text>
                  <Text style={styles.chip}>Large {large}</Text>
                </View>

                {item.status === 'pending' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => updateRequestStatus(item.id, 'rejected')}
                      disabled={actionLoadingId === item.id}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => updateRequestStatus(item.id, 'accepted')}
                      disabled={actionLoadingId === item.id}
                    >
                      {actionLoadingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.text.primary} />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  placeholder: {
    width: 42,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 12,
  },
  listFooter: {
    height: 12,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 10,
  },
  rideTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  rideMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  subSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 20,
  },
  photoRow: {
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  noteImage: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestInfo: {
    flex: 1,
    marginRight: 8,
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
    lineHeight: 17,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPending: {
    backgroundColor: colors.warning[100],
  },
  statusAccepted: {
    backgroundColor: colors.success[100],
  },
  statusRejected: {
    backgroundColor: colors.danger[100],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: colors.text.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: colors.gray[100],
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#FBCBCB',
  },
  acceptBtn: {
    backgroundColor: '#FFF6D9',
    borderWidth: 1,
    borderColor: '#F2DA82',
  },
  rejectBtnText: {
    color: '#B42318',
    fontWeight: '700',
    fontSize: 13,
  },
  acceptBtnText: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
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
