import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useRide } from '../../contexts/RideContext';

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
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides } = useRide();
  const [refreshing, setRefreshing] = useState(false);
  const [userAnnouncements, setUserAnnouncements] = useState<Announcement[]>([]);

  // Filter rides created by current user and create announcements
  useEffect(() => {
    if (user && rides) {
      const userRides = rides.filter(ride => ride.rider_id === user.id);
      const announcements = userRides.map(ride => ({
        id: ride.id,
        title: `Ride to ${ride.dropoff_address.split(',')[0]}`,
        message: `Your ride from ${ride.pickup_address.split(',')[0]} to ${ride.dropoff_address.split(',')[0]} is ${ride.status}`,
        ride_id: ride.id,
        created_at: ride.created_at,
        status: ride.status,
        ride: {
          pickup_address: ride.pickup_address,
          dropoff_address: ride.dropoff_address,
          ride_date: ride.ride_date || 'TBD',
          ride_time: ride.ride_time || 'Flexible',
          available_seats: ride.available_seats || 0,
        }
      }));
      setUserAnnouncements(announcements);
    }
  }, [user, rides]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    if (announcement.ride) {
      router.push(`/(app)/[book-ride]?id=${announcement.ride_id}`);
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
        return 'Pending';
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

        {/* Bottom Row */}
        {item.ride && (
          <View style={styles.cardFooter}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{item.ride.ride_date}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{item.ride.ride_time}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{item.ride.available_seats} seats</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, !isAvailable && styles.actionButtonDisabled]}
              disabled={!isAvailable}
              onPress={() => handleAnnouncementPress(item)}
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Announcements</Text>
        <View style={styles.placeholder} />
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
    marginTop: Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 0) + 4,
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
  // New modern card design
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  statusPillAvailable: {
    backgroundColor: '#DCFCE7',
  },
  statusPillBooked: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: {
    backgroundColor: colors.success[500],
  },
  dotBooked: {
    backgroundColor: colors.danger[500],
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillTextAvailable: {
    color: colors.success[500],
  },
  statusPillTextBooked: {
    color: colors.danger[500],
  },
  routeTimeline: {
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  timelineDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success[500],
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  timelineAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timelineConnector: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  dashedLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.gray[300],
    borderRadius: 1,
  },
  timelineDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger[500],
  },
  infoChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.primary,
  },
  ctaBtn: {
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: colors.gray[300],
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ctaBtnTextDisabled: {
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
  // New card styles
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
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
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
});
