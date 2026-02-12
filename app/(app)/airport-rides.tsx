import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../contexts/PaymentContext';
import { useRide } from '../../contexts/RideContext';

// Transform rides to match discover format
const demoRides = [
  {
    id: 'demo1',
    status: 'pending',
    pickup_address: 'Koramangala 4th Block, Bangalore',
    dropoff_address: 'Bangalore Airport Terminal 1',
    ride_date: '2026-02-15',
    ride_time: '6:30 AM',
    cab_type: 'sedan',
    available_seats: 2,
    created_at: new Date().toISOString(),
    user: {
      name: 'Rahul Sharma',
      rating: 4.8,
      verified: true
    }
  },
  {
    id: 'demo2',
    status: 'active',
    pickup_address: 'Indiranagar 100ft Road',
    dropoff_address: 'Electronic City Phase 1',
    ride_date: '2026-02-15',
    ride_time: '8:00 AM',
    cab_type: 'suv',
    available_seats: 4,
    created_at: new Date().toISOString(),
    user: {
      name: 'Priya Patel',
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 'demo3',
    status: 'pending',
    pickup_address: 'MG Road Metro Station',
    dropoff_address: 'Whitefield IT Hub',
    ride_date: '2026-02-16',
    ride_time: '9:00 AM',
    cab_type: 'sedan',
    available_seats: 1,
    created_at: new Date().toISOString(),
    user: {
      name: 'Amit Kumar',
      rating: 4.5,
      verified: true
    }
  },
  {
    id: 'demo4',
    status: 'active',
    pickup_address: 'HSR Layout Sector 1',
    dropoff_address: 'Marathahalli Bridge',
    ride_date: '2026-02-16',
    ride_time: '10:30 AM',
    cab_type: 'hatchback',
    available_seats: 3,
    created_at: new Date().toISOString(),
    user: {
      name: 'Sneha Gupta',
      rating: 4.7,
      verified: true
    }
  },
  {
    id: 'demo5',
    status: 'pending',
    pickup_address: 'Jayanagar 4th Block',
    dropoff_address: 'Majestic Bus Stand',
    ride_date: '2026-02-17',
    ride_time: '7:15 AM',
    cab_type: 'auto',
    available_seats: 2,
    created_at: new Date().toISOString(),
    user: {
      name: 'Vikram Singh',
      rating: 4.6,
      verified: true
    }
  },
  {
    id: 'demo6',
    status: 'active',
    pickup_address: 'BTM Layout 2nd Stage',
    dropoff_address: 'Koramangala 1st Block',
    ride_date: '2026-02-17',
    ride_time: '8:45 AM',
    cab_type: 'sedan',
    available_seats: 2,
    created_at: new Date().toISOString(),
    user: {
      name: 'Anjali Desai',
      rating: 4.9,
      verified: true
    }
  },
  {
    id: 'demo7',
    status: 'pending',
    pickup_address: 'Silk Board Junction',
    dropoff_address: 'Electronic City Phase 2',
    ride_date: '2026-02-18',
    ride_time: '9:30 AM',
    cab_type: 'hatchback',
    available_seats: 2,
    created_at: new Date().toISOString(),
    user: {
      name: 'Rohit Verma',
      rating: 4.3,
      verified: false
    }
  },
  {
    id: 'demo8',
    status: 'active',
    pickup_address: 'Hebbal Flyover',
    dropoff_address: 'Manyata Tech Park',
    ride_date: '2026-02-18',
    ride_time: '6:00 PM',
    cab_type: 'sedan',
    available_seats: 2,
    created_at: new Date().toISOString(),
    user: {
      name: 'Kavita Reddy',
      rating: 4.8,
      verified: true
    }
  },
  {
    id: 'demo9',
    status: 'active',
    pickup_address: 'Bannerghatta Road',
    dropoff_address: 'Electronic City',
    ride_date: '2026-02-19',
    ride_time: '7:30 AM',
    cab_type: 'suv',
    available_seats: 5,
    created_at: new Date().toISOString(),
    user: {
      name: 'Arjun Nair',
      rating: 5.0,
      verified: true
    }
  },
  {
    id: 'demo10',
    status: 'pending',
    pickup_address: 'HSR Layout to Airport',
    dropoff_address: 'Kempegowda Airport T2',
    ride_date: '2026-02-19',
    ride_time: '5:00 AM',
    cab_type: 'sedan',
    available_seats: 3,
    created_at: new Date().toISOString(),
    user: {
      name: 'Meera Iyer',
      rating: 4.7,
      verified: true
    }
  }
];

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

const mockRides = [
  {
    id: '1',
    driver: 'Maria Garcia',
    from: 'Commercial Street',
    to: 'UB City Mall',
    time: '25 min',
    seats: 2,
    totalSeats: 3,
    rating: 4.6,
    category: 'central',
    date: 'Today',
    departureTime: '6:30 PM',
  },
  {
    id: '11',
    driver: 'William Chen',
    from: 'Airport T2',
    to: 'Electronic City Phase 1',
    time: '60 min',
    seats: 2,
    totalSeats: 4,
    rating: 4.8,
    category: 'airport',
    date: 'Today',
    departureTime: '7:00 PM',
  },
  {
    id: '12',
    driver: 'Sophie Martin',
    from: 'Cubbon Park',
    to: 'ISKCON Temple',
    time: '20 min',
    seats: 3,
    totalSeats: 4,
    rating: 4.9,
    category: 'tourist',
    date: 'Today',
    departureTime: '7:30 PM',
  },
  {
    id: '13',
    driver: 'Alex Thompson',
    from: 'Manyata Tech Park',
    to: 'Hebbal',
    time: '30 min',
    seats: 1,
    totalSeats: 2,
    rating: 4.5,
    category: 'it',
    date: 'Tomorrow',
    departureTime: '8:00 AM',
  },
  {
    id: '14',
    driver: 'Nina Patel',
    from: 'Domlur',
    to: 'Embassy Golf Links',
    time: '35 min',
    seats: 2,
    totalSeats: 3,
    rating: 4.7,
    category: 'it',
    date: 'Tomorrow',
    departureTime: '9:00 AM',
  },
  {
    id: '15',
    driver: 'Chris Evans',
    from: 'Bannerghatta Zoo',
    to: 'Electronic City',
    time: '50 min',
    seats: 2,
    totalSeats: 4,
    rating: 4.6,
    category: 'tourist',
    date: 'Tomorrow',
    departureTime: '10:00 AM',
  },
];

export default function AirportRidesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet, deductRequestFee } = usePayment();
  const { rides: contextRides, loading } = useRide();
  const [searchQuery, setSearchQuery] = useState('');

  // Transform rides to match discover format
  const availableRides = transformRides(contextRides || []);

  const filteredRides = availableRides.filter((ride) => {
    const matchesSearch =
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleRequestToJoin = async (rideId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

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
            const { error, success } = await deductRequestFee(rideId);
            
            if (error || !success) {
              Alert.alert('Payment Failed', 'Failed to process request fee. Please try again.');
              return;
            }

            // Navigate to ride booking page
            router.push(`/(app)/[book-ride]?id=${rideId}`);
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color={colors.gray[500]} />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  headerSpacer: {
    width: 44,
  },
  searchSection: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  ridesList: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  },

  // Ride Card Styles (exact match to discover)
  rideCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#22C55E',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineMarker: {
    width: 20,
    alignItems: 'center',
  },
  timelineDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  timelineDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  timelineConnector: {
    paddingLeft: 9,
    height: 16,
    justifyContent: 'center',
  },
  dashedLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.gray[300],
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gray[500],
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  timelineAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#44403C',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary[500],
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  ctaBtnDisabled: {
    backgroundColor: colors.gray[100],
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  ctaBtnTextDisabled: {
    color: colors.gray[500],
  },
});


