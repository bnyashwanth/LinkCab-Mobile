import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRide } from '../../contexts/RideContext';

interface Announcement {
  id: string;
  title: string;
  message: string;
  ride_id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'active' | 'booked';
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides, fetchRides } = useRide();
  const [refreshing, setRefreshing] = useState(false);
  const [userAnnouncements, setUserAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserAnnouncements([]);
      return;
    }

    const mapped: Announcement[] = rides
      .filter((ride) => ride.rider_id === user.id || ride.driver_id === user.id)
      .map((ride) => ({
        id: ride.id,
        title: `${ride.pickup_address} -> ${ride.dropoff_address}`,
        message: `${ride.cab_type ? ride.cab_type : 'Ride'} | ${ride.available_seats ?? 1} seat(s)`,
        ride_id: ride.id,
        created_at: ride.created_at,
        status: ride.status,
      }));

    setUserAnnouncements(mapped);
  }, [rides, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRides();
    } finally {
      setRefreshing(false);
    }
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={styles.announcementCard}
      onPress={() => router.push(`/(app)/announcement-details?id=${item.ride_id}`)}
      activeOpacity={0.86}
    >
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.announcementDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.announcementMessage} numberOfLines={1}>{item.message}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCF8" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Announcements</Text>
        <View style={styles.rightSpacer} />
      </View>

      <FlatList
        data={userAnnouncements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncement}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.listContent,
          userAnnouncements.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={58} color="#8C8C8C" />
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptySubtitle}>Create your first ride to see announcements here.</Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(app)/create-ride')}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaButtonText}>Create Your First Ride</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 0.1,
  },
  rightSpacer: {
    width: 34,
    height: 34,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F8F8F2',
    borderRadius: 18,
    paddingVertical: 38,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EFEFE8',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#777777',
    textAlign: 'center',
    maxWidth: 280,
  },
  ctaButton: {
    marginTop: 22,
    width: '100%',
    backgroundColor: '#F6CE46',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8BF35',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEC',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  announcementTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#151515',
    marginRight: 8,
  },
  announcementDate: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '500',
  },
  announcementMessage: {
    fontSize: 12,
    color: '#666666',
  },
});
