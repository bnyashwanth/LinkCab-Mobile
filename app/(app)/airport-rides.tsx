import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { usePayment } from '@/contexts/PaymentContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { getValidRideId } from '@/utils/rideIdUtils';

// Transform rides to match discover format
const transformRides = (rides: any[]) => {
  return rides.map(ride => ({
    id: ride.id,
    driver: ride.user?.name || ride.driver_name || 'Unknown Driver',
    from: ride.pickup_address,
    to: ride.dropoff_address,
    date: ride.ride_date,
    time: ride.ride_time,
    cabType: ride.cab_type ? ride.cab_type.charAt(0).toUpperCase() + ride.cab_type.slice(1) : 'Sedan',
    seats: ride.available_seats ? `${ride.available_seats} seats` : '1 seat',
    rating: ride.user?.rating?.toString() || '4.5',
    verified: ride.user?.verified || false,
    available: ride.status === 'pending' || ride.status === 'active',
  }));
};

export default function AirportRidesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet, deductRequestFee } = usePayment();
  const { rides: contextRides, loading } = useRide();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Use only real rides from context
  const rides = contextRides;

  // Transform rides to match discover format
  const availableRides = transformRides(contextRides || []);

  const filteredRides = availableRides.filter((ride) => {
    const matchesSearch =
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh rides data
    setRefreshing(false);
  };

  const handleRequestToJoin = async (rideId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

    // Convert ride ID to valid UUID using utility function
    const mappedId = getValidRideId(rideId);

    // Check wallet balance
    if (!wallet || wallet.balance < 1) {
      Alert.alert(
        'Insufficient Balance',
        'Please top up your wallet to send ride requests.\n\nMinimum balance required: ₹1',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Top Up Wallet',
            style: 'default',
            onPress: () => router.push('/(app)/wallet'),
          },
        ]
      );
      return;
    }

    // Show confirmation dialog with fee information
    Alert.alert(
      'Request Ride',
      'A ₹1 request fee will be deducted from your wallet to ensure serious intent.\n\nThis fee will be refunded if your request is rejected.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pay ₹1 & Request',
          style: 'default',
          onPress: async () => {
            // Deduct the request fee
            const { error, success } = await deductRequestFee(mappedId);
            
            if (error || !success) {
              Alert.alert('Payment Failed', 'Failed to process request fee. Please try again.');
              return;
            }

            // Navigate to ride booking page
            router.push(`/(app)/[book-ride]?id=${mappedId}`);
          },
        },
      ]
    );
  };

  const renderRide = ({ item }: any) => {
    const initials = item.driver.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/(app)/[book-ride]?id=${item.id}`)}
        activeOpacity={0.92}
      >
        {/* Top Row: Driver + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>{initials}</Text>
              {item.verified && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color={colors.background.primary} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.driverName} numberOfLines={1}>{item.driver}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={11} color={'#F59E0B'} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusPill, item.available ? styles.statusPillAvailable : styles.statusPillBooked]}>
            <View style={[styles.statusDot, item.available ? styles.dotAvailable : styles.dotBooked]} />
            <Text style={[styles.statusPillText, item.available ? styles.statusPillTextAvailable : styles.statusPillTextBooked]}>
              {item.available ? 'Available' : 'Booked'}
            </Text>
          </View>
        </View>

        {/* Route Timeline */}
        <View style={styles.routeTimeline}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}><View style={styles.timelineDotGreen} /></View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>PICKUP</Text>
              <Text style={styles.timelineAddress} numberOfLines={1}>{item.from}</Text>
            </View>
          </View>
          <View style={styles.timelineConnector}><View style={styles.dashedLine} /></View>
          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}><View style={styles.timelineDotRed} /></View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>DROP-OFF</Text>
              <Text style={styles.timelineAddress} numberOfLines={1}>{item.to}</Text>
            </View>
          </View>
        </View>

        {/* Info Chips */}
        <View style={styles.infoChipsRow}>
          <View style={styles.infoChip}>
            <Ionicons name="calendar-outline" size={13} color={colors.text.primary} />
            <Text style={styles.infoChipText}>{item.date}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={13} color={colors.text.primary} />
            <Text style={styles.infoChipText}>{item.time}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="car-sport-outline" size={13} color={colors.text.primary} />
            <Text style={styles.infoChipText}>{item.cabType}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={13} color={colors.text.primary} />
            <Text style={styles.infoChipText}>{item.seats}</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaBtn, 
            !item.available && styles.ctaBtnDisabled,
            (!wallet || wallet.balance < 1) && styles.ctaBtnDisabled
          ]}
          disabled={!item.available || !wallet || wallet.balance < 1}
          onPress={() => handleRequestToJoin(item.id)}
          activeOpacity={0.85}
        >
          <Ionicons 
            name="send" 
            size={16} 
            color={!item.available || (!wallet || wallet.balance < 1) ? colors.gray[500] : colors.text.primary} 
          />
          <Text style={[
            styles.ctaBtnText,
            !item.available && styles.ctaBtnTextDisabled,
            (!wallet || wallet.balance < 1) && styles.ctaBtnTextDisabled
          ]}>
            {!item.available 
              ? 'Not Available' 
              : (!wallet || wallet.balance < 1) 
                ? 'Top Up Required (₹1)' 
                : 'Request to Join (₹1)'
            }
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Airport Rides</Text>
          <Text style={styles.subtitle}>Find rides to and from airports</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rides, drivers, locations..."
            placeholderTextColor={colors.gray[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Rides List */}
      <FlatList
        data={filteredRides}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ridesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color={colors.gray[500]} />
            <Text style={styles.emptyTitle}>No airport rides found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or check back later</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  ridesList: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginRight: 4,
  },
  dotAvailable: {
    backgroundColor: '#22C55E',
  },
  dotBooked: {
    backgroundColor: '#EF4444',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPillTextAvailable: {
    color: '#166534',
  },
  statusPillTextBooked: {
    color: '#991B1B',
  },
  routeTimeline: {
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineMarker: {
    width: 24,
    alignItems: 'center',
  },
  timelineDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  timelineDotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 8,
  },
  timelineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  timelineAddress: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  timelineConnector: {
    marginLeft: 12,
    height: 20,
    justifyContent: 'center',
  },
  dashedLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[300],
    borderRadius: 1,
  },
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  infoChipText: {
    fontSize: 12,
    color: colors.text.primary,
    marginLeft: 4,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaBtnDisabled: {
    backgroundColor: colors.gray[200],
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background.primary,
    marginLeft: 8,
  },
  ctaBtnTextDisabled: {
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
});
