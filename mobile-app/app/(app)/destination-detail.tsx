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
import { colors } from "../../constants/theme";
import { OptimizedRideCard } from "../../components/OptimizedRideCard";

const { width } = Dimensions.get('window');

// local BRAND alias using theme colors for backward compatibility
const BRAND = {
  yellow: colors.secondary[500],
  yellowLight: colors.secondary[100],
  yellowDark: colors.secondary[600],
  black: colors.text.primary,
  blackLight: colors.gray[700],
  white: colors.background.primary,
  gray: colors.gray[500],
  grayLight: colors.gray[100],
  grayMedium: colors.gray[200],
  green: colors.success[500],
  red: colors.danger[500],
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

  // Currently no demo/sample rides – this will be populated by real data in future
  const destinationRides: any[] = [];

  const filteredRides = useMemo(() => {
    return destinationRides.filter((ride) => {
      const matchesSearch = searchQuery === '' ||
        ride.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.dropoff_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const renderRide = ({ item }: any) => (
    <OptimizedRideCard
      ride={item}
      onPress={() => router.push(`/book-ride/${item.id}`)}
    />
  );

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
