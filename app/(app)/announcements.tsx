import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme'; // Ensure this path matches your project
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext'; // Ensure this path matches your project
import { useRide } from '@/contexts/RideContext'; // Ensure this path matches your project

interface Announcement {
  id: string;
  title: string;
  message: string;
  ride_id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'active' | 'booked';
  ride?: {
    pickup_address: string;
    dropoff_address: string;
    ride_date: string;
    ride_time: string;
    available_seats: number;
  };
  pickup_address: string;
  dropoff_address: string;
  ride_date: string;
  ride_time: string;
  available_seats: number;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides, fetchRides, deleteAllRides } = useRide();
  const [refreshing, setRefreshing] = useState(false);
  const [userAnnouncements, setUserAnnouncements] = useState<Announcement[]>([]);

  // Fetch rides from database on mount
  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  // Sync context rides into local userAnnouncements state
  useEffect(() => {
    if (user && rides.length > 0) {
      const myAnnouncements: Announcement[] = rides
        .filter((ride) => ride.rider_id === user.id)
        .map((ride) => ({
          id: ride.id,
          title: `${ride.pickup_address} → ${ride.dropoff_address}`,
          message: `${ride.cab_type ? ride.cab_type.charAt(0).toUpperCase() + ride.cab_type.slice(1) : 'Ride'} · ${ride.available_seats ?? 1} seat(s)`,
          ride_id: ride.id,
          created_at: ride.created_at,
          status: ride.status,
          ride: {
            pickup_address: ride.pickup_address,
            dropoff_address: ride.dropoff_address,
            ride_date: ride.ride_date ?? '',
            ride_time: ride.ride_time ?? '',
            available_seats: ride.available_seats ?? 1,
          },
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          ride_date: ride.ride_date ?? '',
          ride_time: ride.ride_time ?? '',
          available_seats: ride.available_seats ?? 1,
        }));
      setUserAnnouncements(myAnnouncements);
    } else {
      setUserAnnouncements([]);
    }
  }, [rides, user]);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Rides',
      'Are you sure you want to delete all your ride announcements? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllRides();
              setUserAnnouncements([]);
            } catch (error) {
              console.error('Error clearing rides:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRides();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    if (announcement.ride) {
      router.push(`/(app)/announcement-details?id=${announcement.ride_id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return colors.success[500];
      case 'completed':
        return colors.gray[500];
      case 'cancelled':
        return colors.danger[500];
      case 'pending':
        return colors.warning[500];
      case 'in_progress':
        return colors.info[500];
      case 'booked':
        return colors.secondary[500];
      default:
        return colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'accepted':
        return 'Accepted';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Available';
      case 'in_progress':
        return 'In Progress';
      case 'booked':
        return 'Booked';
      default:
        return 'Unknown';
    }
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const isAvailable = item.status === 'active' || item.status === 'pending';

    return (
      <TouchableOpacity
        style={styles.newRideCard}
        onPress={() => handleAnnouncementPress(item)}
        activeOpacity={0.92}
      >
        {/* Header with Status */}
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={styles.cardTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.message}</Text>

        {/* Route Info */}
        {item.ride && (
          <View style={styles.routeSection}>
            <View style={styles.routePoint}>
              <View style={[styles.pointIcon, { backgroundColor: colors.success[500] }]}>
                <Ionicons name="location" size={12} color="white" />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>{item.ride.pickup_address}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={[styles.pointIcon, { backgroundColor: colors.danger[500] }]}>
                <Ionicons name="flag" size={12} color="white" />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>{item.ride.dropoff_address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ride Details */}
        {item.ride && (
          <View style={styles.cardTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
              <Text style={{ fontSize: 12, color: colors.gray[500], marginLeft: 4 }}>{item.ride.ride_date}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
              <Text style={{ fontSize: 12, color: colors.gray[500], marginLeft: 4 }}>{item.ride.ride_time}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={14} color={colors.gray[500]} />
              <Text style={{ fontSize: 12, color: colors.gray[500], marginLeft: 4 }}>{item.ride.available_seats} seats</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {item.ride && (
          <View style={styles.cardTopRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !isAvailable && styles.actionButtonDisabled
              ]}
              onPress={() => handleAnnouncementPress(item)}
              disabled={!isAvailable}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, !isAvailable && styles.actionButtonTextDisabled]}>
                {isAvailable ? 'View Details' : getStatusText(item.status)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    // FIXED: Added edges={['top']} and removed manual marginTop in styles
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack?.()) {
              router.back();
            } else {
              router.replace('/(app)/home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Announcements</Text>
        {userAnnouncements.length > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={22} color={colors.danger[500]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <FlatList
        data={userAnnouncements}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={48} color={colors.gray[500]} />
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptySubtitle}>Create your first ride to see announcements here</Text>
            <TouchableOpacity
              style={styles.createRideBtn}
              onPress={() => router.push('/(app)/create-ride')}
            >
              <Text style={styles.createRideBtnText}>Create Your First Ride</Text>
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
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    // FIXED: Removed manual marginTop calculation as SafeAreaView handles it
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
  listContainer: {
    padding: 20,
    gap: 12,
  },
  newRideCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
    lineHeight: 20,
  },
  routeSection: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[300],
    marginLeft: 12,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionButtonTextDisabled: {
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  createRideBtn: {
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createRideBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});