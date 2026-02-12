import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Brand Colors
const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF8DC',
  yellowDark: '#E6C200',
  black: '#1A1A1A',
  blackLight: '#333333',
  white: '#FFFFFF',
  gray: '#6B7280',
  grayLight: '#F5F5F5',
  grayMedium: '#E5E7EB',
  green: '#22C55E',
  red: '#EF4444',
};

// All destinations data
const allDestinations = [
  { id: '1', name: 'Kempegowda Airport T1', address: 'Terminal 1, International Airport', rides: 256, category: 'airport', rating: 4.9 },
  { id: '2', name: 'Kempegowda Airport T2', address: 'Terminal 2, Domestic Airport', rides: 189, category: 'airport', rating: 4.8 },
  { id: '3', name: 'Airport Business Park', address: 'Near Airport, Devanahalli', rides: 67, category: 'airport', rating: 4.5 },
  { id: '4', name: 'Aerospace Park', address: 'Devanahalli Business District', rides: 45, category: 'airport', rating: 4.4 },
  { id: '5', name: 'Electronic City Phase 1', address: 'Infosys, Wipro Campus Area', rides: 189, category: 'it', rating: 4.7 },
  { id: '6', name: 'Electronic City Phase 2', address: 'TCS, Tech Mahindra Area', rides: 156, category: 'it', rating: 4.6 },
  { id: '7', name: 'Whitefield IT Hub', address: 'ITPL Main Road', rides: 172, category: 'it', rating: 4.7 },
  { id: '8', name: 'Manyata Tech Park', address: 'Hebbal, Outer Ring Road', rides: 234, category: 'it', rating: 4.8 },
  { id: '9', name: 'Embassy Golf Links', address: 'Domlur, Inner Ring Road', rides: 145, category: 'it', rating: 4.6 },
  { id: '10', name: 'Bagmane Tech Park', address: 'CV Raman Nagar', rides: 98, category: 'it', rating: 4.5 },
  { id: '11', name: 'RMZ Ecospace', address: 'Marathahalli, Outer Ring Road', rides: 167, category: 'it', rating: 4.6 },
  { id: '12', name: 'Prestige Tech Park', address: 'Kadubeesanahalli', rides: 123, category: 'it', rating: 4.5 },
  { id: '13', name: 'MG Road', address: 'Central Business District', rides: 234, category: 'central', rating: 4.6 },
  { id: '14', name: 'Brigade Road', address: 'Shopping & Entertainment Hub', rides: 198, category: 'central', rating: 4.5 },
  { id: '15', name: 'Commercial Street', address: 'Historic Shopping Area', rides: 165, category: 'central', rating: 4.4 },
  { id: '16', name: 'Koramangala', address: 'Startup & Restaurant Hub', rides: 256, category: 'central', rating: 4.7 },
  { id: '17', name: 'Indiranagar', address: '100ft Road, Lifestyle Zone', rides: 189, category: 'central', rating: 4.6 },
  { id: '18', name: 'HSR Layout', address: 'Residential & Cafe Hub', rides: 145, category: 'central', rating: 4.5 },
  { id: '19', name: 'Jayanagar', address: '4th Block, South Bangalore', rides: 134, category: 'central', rating: 4.4 },
  { id: '20', name: 'Marathahalli', address: 'ORR Junction', rides: 178, category: 'central', rating: 4.3 },
  { id: '21', name: 'Lalbagh Garden', address: 'Botanical Garden, South Bangalore', rides: 123, category: 'tourist', rating: 4.8 },
  { id: '22', name: 'Cubbon Park', address: 'Central Park, MG Road Area', rides: 145, category: 'tourist', rating: 4.7 },
  { id: '23', name: 'Bangalore Palace', address: 'Vasanth Nagar', rides: 98, category: 'tourist', rating: 4.9 },
  { id: '24', name: 'ISKCON Temple', address: 'Rajajinagar', rides: 167, category: 'tourist', rating: 4.8 },
  { id: '25', name: 'Bannerghatta Zoo', address: 'Bannerghatta National Park', rides: 78, category: 'tourist', rating: 4.6 },
  { id: '26', name: 'Innovative Film City', address: 'Bidadi, Bangalore-Mysore Road', rides: 56, category: 'tourist', rating: 4.4 },
  { id: '27', name: 'Wonderla', address: 'Mysore Road, Amusement Park', rides: 89, category: 'tourist', rating: 4.7 },
  { id: '28', name: 'UB City Mall', address: 'Vittal Mallya Road', rides: 134, category: 'tourist', rating: 4.5 },
  { id: '29', name: 'Nandi Hills', address: 'Sunrise Point, Chikkaballapur', rides: 67, category: 'tourist', rating: 4.9 },
  { id: '30', name: 'Vidhana Soudha', address: 'State Legislature, Dr. Ambedkar Road', rides: 89, category: 'tourist', rating: 4.6 },
];

// Sample rides for this specific destination
const getDestinationRides = (destinationId: string) => [
  {
    id: `ride_${destinationId}_1`,
    status: 'pending',
    pickup_address: 'Koramangala 4th Block, Bangalore',
    dropoff_address: allDestinations.find(d => d.id === destinationId)?.name || 'Destination',
    ride_date: '2026-02-15',
    ride_time: '6:30 AM',
    cab_type: 'sedan',
    available_seats: 3,
    user: {
      name: 'Rahul Sharma',
      rating: 4.8,
      verified: true
    }
  },
  {
    id: `ride_${destinationId}_2`,
    status: 'active',
    pickup_address: 'Indiranagar 100ft Road',
    dropoff_address: allDestinations.find(d => d.id === destinationId)?.name || 'Destination',
    ride_date: '2026-02-15',
    ride_time: '8:00 AM',
    cab_type: 'suv',
    available_seats: 4,
    user: {
      name: 'Priya Patel',
      rating: 4.9,
      verified: true
    }
  },
  {
    id: `ride_${destinationId}_3`,
    status: 'pending',
    pickup_address: 'MG Road Metro Station',
    dropoff_address: allDestinations.find(d => d.id === destinationId)?.name || 'Destination',
    ride_date: '2026-02-16',
    ride_time: '9:00 AM',
    cab_type: 'sedan',
    available_seats: 2,
    user: {
      name: 'Amit Kumar',
      rating: 4.5,
      verified: true
    }
  },
  {
    id: `ride_${destinationId}_4`,
    status: 'active',
    pickup_address: 'HSR Layout Sector 1',
    dropoff_address: allDestinations.find(d => d.id === destinationId)?.name || 'Destination',
    ride_date: '2026-02-16',
    ride_time: '7:30 AM',
    cab_type: 'hatchback',
    available_seats: 1,
    user: {
      name: 'Sneha Gupta',
      rating: 4.7,
      verified: true
    }
  },
];

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const destination = allDestinations.find(d => d.id === id);
  
  if (!destination) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Destination not found</Text>
      </SafeAreaView>
    );
  }

  const destinationRides = getDestinationRides(id as string);

  const filteredRides = useMemo(() => {
    return destinationRides.filter((ride) => {
      const matchesSearch = searchQuery === '' || 
        ride.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.dropoff_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const renderRide = ({ item }: any) => {
    const isAvailable = item.status === 'pending' || item.status === 'active';
    const initials = item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.rideCard}
        onPress={() => router.push(`/book-ride/${item.id}`)}
        activeOpacity={0.92}
      >
        {/* Top Row: Driver + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>{initials}</Text>
              {item.user.verified && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color={BRAND.white} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.driverName} numberOfLines={1}>{item.user.name}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={11} color={'#F59E0B'} />
                <Text style={styles.ratingText}>{item.user.rating}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusPill, isAvailable ? styles.statusPillAvailable : styles.statusPillBooked]}>
            <View style={[styles.statusDotIndicator, isAvailable ? styles.dotAvailable : styles.dotBooked]} />
            <Text style={[styles.statusPillText, isAvailable ? styles.statusPillTextAvailable : styles.statusPillTextBooked]}>
              {isAvailable ? 'Available' : 'Booked'}
            </Text>
          </View>
        </View>

        {/* Route Timeline */}
        <View style={styles.routeTimeline}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}><View style={styles.timelineDotGreen} /></View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>PICKUP</Text>
              <Text style={styles.timelineAddress} numberOfLines={1}>{item.pickup_address}</Text>
            </View>
          </View>
          <View style={styles.timelineConnector}><View style={styles.dashedLine} /></View>
          <View style={styles.timelineRow}>
            <View style={styles.timelineMarker}><View style={styles.timelineDotRed} /></View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>DROP-OFF</Text>
              <Text style={styles.timelineAddress} numberOfLines={1}>{item.dropoff_address}</Text>
            </View>
          </View>
        </View>

        {/* Info Chips */}
        <View style={styles.infoChipsRow}>
          <View style={styles.infoChip}>
            <Ionicons name="calendar-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.ride_date}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.ride_time}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="car-sport-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.cab_type}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.available_seats}</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaBtn, !isAvailable && styles.ctaBtnDisabled]}
          disabled={!isAvailable}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaBtnText, !isAvailable && styles.ctaBtnTextDisabled]}>
            {isAvailable ? 'Request to Join' : 'Fully Booked'}
          </Text>
          {isAvailable && <Ionicons name="arrow-forward" size={16} color={BRAND.black} />}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{destination.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Destination Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Ionicons name="location" size={32} color={BRAND.yellow} />
        </View>
        <Text style={styles.heroTitle}>{destination.name}</Text>
        <Text style={styles.heroAddress}>{destination.address}</Text>
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="car-outline" size={16} color={BRAND.black} />
            <Text style={styles.statText}>{destination.rides} rides</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={'#F59E0B'} />
            <Text style={styles.statText}>{destination.rating} rating</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={16} color={BRAND.green} />
            <Text style={styles.statText}>Popular</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={BRAND.yellow} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rides to this destination..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BRAND.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={BRAND.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Available Rides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rides to {destination.name}</Text>
          <Text style={styles.sectionSubtitle}>{filteredRides.length} rides found</Text>
          
          {filteredRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={BRAND.grayMedium} />
              <Text style={styles.emptyStateText}>No rides found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search</Text>
            </View>
          ) : (
            <View style={styles.ridesList}>
              {filteredRides.map((ride) => (
                <View key={ride.id}>
                  {renderRide({ item: ride })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Create Ride CTA */}
        <TouchableOpacity
          style={styles.createRideCard}
          onPress={() => router.push(`/(app)/create-ride?destination=${destination.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.createRideContent}>
            <Text style={styles.createRideTitle}>Create a Ride to {destination.name}</Text>
            <Text style={styles.createRideSubtitle}>Share your journey with co-travelers</Text>
          </View>
          <View style={styles.createRideButton}>
            <Ionicons name="add" size={24} color={BRAND.black} />
          </View>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroAddress: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: BRAND.black,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: BRAND.black,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: BRAND.gray,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: BRAND.black,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 4,
  },

  // Ride Card (matching home page design)
  ridesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  rideCard: {
    backgroundColor: BRAND.white,
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
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
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
    borderColor: BRAND.white,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusPillAvailable: { backgroundColor: '#ECFDF5' },
  statusPillBooked: { backgroundColor: '#FEF2F2' },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: { backgroundColor: '#16A34A' },
  dotBooked: { backgroundColor: '#DC2626' },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillTextAvailable: { color: '#16A34A' },
  statusPillTextBooked: { color: '#DC2626' },

  // Route Timeline
  routeTimeline: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    height: 18,
    justifyContent: 'center',
  },
  dashedLine: {
    width: 2,
    height: 18,
    backgroundColor: '#D4D4D4',
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  timelineAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.black,
  },

  // Info Chips
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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

  // CTA Button
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 6,
  },
  ctaBtnDisabled: {
    backgroundColor: '#F5F5F4',
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
  },
  ctaBtnTextDisabled: {
    color: '#A8A29E',
  },
  createRideCard: {
    marginHorizontal: 20,
    backgroundColor: BRAND.black,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createRideContent: {
    flex: 1,
    marginRight: 16,
  },
  createRideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: 4,
  },
  createRideSubtitle: {
    fontSize: 13,
    color: BRAND.white,
    opacity: 0.9,
  },
  createRideButton: {
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorText: {
    fontSize: 16,
    color: BRAND.red,
    textAlign: 'center',
    marginTop: 50,
  },
});
