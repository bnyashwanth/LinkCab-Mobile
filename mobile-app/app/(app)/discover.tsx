import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ScrollViewProps, ScrollView, Alert, TextInput, Dimensions, SafeAreaView, StatusBar } from 'react-native';

// helper used during debugging to catch stray text nodes
const DebugScrollView: React.FC<ScrollViewProps> = props => {
  const childrenArray = React.Children.toArray(props.children);
  childrenArray.forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      console.warn('DebugScrollView found raw string child:', child);
    }
  });
  return <ScrollView {...props}>{props.children}</ScrollView>;
};
import { Ionicons } from '@expo/vector-icons';
import { OptimizedRideCard } from "../../components/OptimizedRideCard";
import { useAuth } from "../../contexts/AuthContext";
import { usePayment } from "../../contexts/PaymentContext";
import { useRide } from "../../contexts/RideContext";
import { getValidRideId } from "../../lib/rideIdUtils";

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'airport', label: 'Airport', icon: 'airplane-outline' },
  { id: 'it', label: 'IT Parks', icon: 'business-outline' },
  { id: 'central', label: 'Central', icon: 'location-outline' },
  { id: 'tourist', label: 'Tourist', icon: 'camera-outline' },
];

const popularDestinations = [
  // Airport destinations
  { id: '1', name: 'Kempegowda Airport T1', address: 'Terminal 1, International Airport', rides: 256, category: 'airport', rating: 4.9 },
  { id: '2', name: 'Kempegowda Airport T2', address: 'Terminal 2, Domestic Airport', rides: 189, category: 'airport', rating: 4.8 },
  { id: '3', name: 'Airport Business Park', address: 'Near Airport, Devanahalli', rides: 67, category: 'airport', rating: 4.5 },
  { id: '4', name: 'Aerospace Park', address: 'Devanahalli Business District', rides: 45, category: 'airport', rating: 4.4 },

  // IT Parks destinations
  { id: '5', name: 'Electronic City Phase 1', address: 'Infosys, Wipro Campus Area', rides: 189, category: 'it', rating: 4.7 },
  { id: '6', name: 'Electronic City Phase 2', address: 'TCS, Tech Mahindra Area', rides: 156, category: 'it', rating: 4.6 },
  { id: '7', name: 'Whitefield IT Hub', address: 'ITPL Main Road', rides: 172, category: 'it', rating: 4.7 },
  { id: '8', name: 'Manyata Tech Park', address: 'Hebbal, Outer Ring Road', rides: 234, category: 'it', rating: 4.8 },
  { id: '9', name: 'Embassy Golf Links', address: 'Domlur, Inner Ring Road', rides: 145, category: 'it', rating: 4.6 },
  { id: '10', name: 'Bagmane Tech Park', address: 'CV Raman Nagar', rides: 98, category: 'it', rating: 4.5 },
  { id: '11', name: 'RMZ Ecospace', address: 'Marathahalli, Outer Ring Road', rides: 167, category: 'it', rating: 4.6 },
  { id: '12', name: 'Prestige Tech Park', address: 'Kadubeesanahalli', rides: 123, category: 'it', rating: 4.5 },
  { id: '13', name: 'Global Tech Park', address: 'Bellandur, Outer Ring Road', rides: 89, category: 'it', rating: 4.4 },
  { id: '14', name: 'Salarpuria Sattva', address: 'Marathahalli', rides: 76, category: 'it', rating: 4.3 },
  { id: '15', name: 'Cessna Business Park', address: 'Domlur', rides: 67, category: 'it', rating: 4.5 },
  { id: '16', name: 'Aeroplaza 7', address: 'Marathahalli', rides: 54, category: 'it', rating: 4.2 },

  // Central destinations
  { id: '17', name: 'MG Road', address: 'Central Business District', rides: 234, category: 'central', rating: 4.6 },
  { id: '18', name: 'Brigade Road', address: 'Shopping & Entertainment Hub', rides: 198, category: 'central', rating: 4.5 },
  { id: '19', name: 'Commercial Street', address: 'Historic Shopping Area', rides: 165, category: 'central', rating: 4.4 },
  { id: '20', name: 'Koramangala', address: 'Startup & Restaurant Hub', rides: 256, category: 'central', rating: 4.7 },
  { id: '21', name: 'Indiranagar', address: '100ft Road, Lifestyle Zone', rides: 189, category: 'central', rating: 4.6 },
  { id: '22', name: 'HSR Layout', address: 'Residential & Cafe Hub', rides: 145, category: 'central', rating: 4.5 },
  { id: '23', name: 'Jayanagar', address: '4th Block, South Bangalore', rides: 134, category: 'central', rating: 4.4 },
  { id: '24', name: 'Marathahalli', address: 'ORR Junction', rides: 178, category: 'central', rating: 4.3 },
  { id: '25', name: 'BTM Layout', address: '2nd Stage', rides: 156, category: 'central', rating: 4.4 },
  { id: '26', name: 'Basavanagudi', address: 'South Bangalore', rides: 123, category: 'central', rating: 4.5 },
  { id: '27', name: 'Sadashivanagar', address: 'North Bangalore', rides: 98, category: 'central', rating: 4.6 },
  { id: '28', name: 'Frazer Town', address: 'East Bangalore', rides: 87, category: 'central', rating: 4.3 },

  // Tourist destinations
  { id: '29', name: 'Lalbagh Garden', address: 'Botanical Garden, South Bangalore', rides: 123, category: 'tourist', rating: 4.8 },
  { id: '30', name: 'Cubbon Park', address: 'Central Park, MG Road Area', rides: 145, category: 'tourist', rating: 4.7 },
  { id: '31', name: 'Bangalore Palace', address: 'Vasanth Nagar', rides: 98, category: 'tourist', rating: 4.9 },
  { id: '32', name: 'ISKCON Temple', address: 'Rajajinagar', rides: 167, category: 'tourist', rating: 4.8 },
  { id: '33', name: 'Bannerghatta Zoo', address: 'Bannerghatta National Park', rides: 78, category: 'tourist', rating: 4.6 },
  { id: '34', name: 'Innovative Film City', address: 'Bidadi, Bangalore-Mysore Road', rides: 56, category: 'tourist', rating: 4.4 },
  { id: '35', name: 'Wonderla', address: 'Mysore Road, Amusement Park', rides: 89, category: 'tourist', rating: 4.7 },
  { id: '36', name: 'UB City Mall', address: 'Vittal Mallya Road', rides: 134, category: 'tourist', rating: 4.5 },
  { id: '37', name: 'Phoenix Marketcity', address: 'Whitefield', rides: 145, category: 'tourist', rating: 4.6 },
  { id: '38', name: 'Orion Mall', address: 'Rajajinagar', rides: 98, category: 'tourist', rating: 4.4 },
  { id: '39', name: 'Mantri Square', address: 'Malleswaram', rides: 87, category: 'tourist', rating: 4.3 },
  { id: '40', name: 'Garuda Mall', address: 'Magrath Road', rides: 76, category: 'tourist', rating: 4.2 },

  // Educational destinations
  { id: '41', name: 'IISc', address: 'Indian Institute of Science', rides: 89, category: 'education', rating: 4.8 },
  { id: '42', name: 'IIM Bangalore', address: 'Bannerghatta Road', rides: 67, category: 'education', rating: 4.9 },
  { id: '43', name: 'Christ University', address: 'Hosur Road', rides: 98, category: 'education', rating: 4.6 },
  { id: '44', name: 'PES University', address: 'Banashankari', rides: 76, category: 'education', rating: 4.5 },
  { id: '45', name: 'RV College', address: 'Mysore Road', rides: 65, category: 'education', rating: 4.4 },
  { id: '46', name: 'BMS College', address: 'Basavanagudi', rides: 54, category: 'education', rating: 4.3 },

  // Healthcare destinations
  { id: '47', name: 'Manipal Hospital', address: 'Old Airport Road', rides: 123, category: 'healthcare', rating: 4.7 },
  { id: '48', name: 'Apollo Hospital', address: 'Bannerghatta Road', rides: 98, category: 'healthcare', rating: 4.8 },
  { id: '49', name: 'Fortis Hospital', address: 'Cunningham Road', rides: 87, category: 'healthcare', rating: 4.6 },
  { id: '50', name: 'NIMHANS', address: 'Hosur Road', rides: 76, category: 'healthcare', rating: 4.9 },
  { id: '51', name: 'Victoria Hospital', address: 'KR Road', rides: 65, category: 'healthcare', rating: 4.4 },
  { id: '52', name: 'St. Johns Hospital', address: 'Koramangala', rides: 89, category: 'healthcare', rating: 4.7 },

  // Shopping & Entertainment
  { id: '53', name: 'Forum Mall', address: 'Koramangala', rides: 145, category: 'shopping', rating: 4.5 },
  { id: '54', name: 'Garuda Mall', address: 'Magrath Road', rides: 98, category: 'shopping', rating: 4.3 },
  { id: '55', name: 'Gopalan Mall', address: 'Old Madras Road', rides: 76, category: 'shopping', rating: 4.2 },
  { id: '56', name: 'Total Mall', address: 'Sarjapur Road', rides: 67, category: 'shopping', rating: 4.1 },
  { id: '57', name: 'Central Mall', address: 'Jayanagar', rides: 54, category: 'shopping', rating: 4.0 },

  // Residential Areas
  { id: '58', name: 'HSR Layout', address: 'Sector 1-7', rides: 167, category: 'residential', rating: 4.4 },
  { id: '59', name: 'BTM Layout', address: '1st & 2nd Stage', rides: 145, category: 'residential', rating: 4.3 },
  { id: '60', name: 'Yelahanka', address: 'New Town', rides: 123, category: 'residential', rating: 4.2 },
  { id: '61', name: 'Banashankari', address: '3rd Stage', rides: 98, category: 'residential', rating: 4.1 },
  { id: '62', name: 'Kalyan Nagar', address: 'North Bangalore', rides: 87, category: 'residential', rating: 4.0 },
  { id: '63', name: 'HRBR Layout', address: 'Kalyan Nagar', rides: 76, category: 'residential', rating: 3.9 },
  { id: '64', name: 'Kammanahalli', address: 'East Bangalore', rides: 65, category: 'residential', rating: 3.8 },
  { id: '65', name: 'HBR Layout', address: 'North Bangalore', rides: 54, category: 'residential', rating: 3.7 },

  // Additional Tourist Spots
  { id: '66', name: 'Nandi Hills', address: 'Sunrise Point, Chikkaballapur', rides: 67, category: 'tourist', rating: 4.9 },
  { id: '67', name: 'Vidhana Soudha', address: 'State Legislature, Dr. Ambedkar Road', rides: 89, category: 'tourist', rating: 4.6 },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { wallet } = usePayment();
  const { allRides, fetchAllRides } = useRide();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch rides from other users on mount
  React.useEffect(() => {
    if (user) fetchAllRides();
  }, [user]);

  const filteredDestinations = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return popularDestinations.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [popularDestinations, searchQuery, selectedCategory]);

  const renderDestination = ({ item }: any) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => router.push(`/(app)/destination?category=${item.category}`)}
      activeOpacity={0.92}
    >
      {/* Top: Icon + Name */}
      <View style={styles.destTopRow}>
        <View style={styles.destIcon}>
          <Ionicons name="location" size={18} color={"#1A1A1A"} />
        </View>
        <View style={styles.destNameWrap}>
          <Text style={styles.destinationName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.destinationAddress} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>

      {/* Info Chips */}
      <View style={styles.destChips}>
        <View style={styles.destChip}>
          <Ionicons name="car-outline" size={12} color={"#1A1A1A"} />
          <Text style={styles.destChipText}>{item.rides} rides</Text>
        </View>
        <View style={styles.destChip}>
          <Ionicons name="star" size={12} color={'#F59E0B'} />
          <Text style={styles.destChipText}>{item.rating}</Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.destCta}>
        <Text style={styles.destCtaText}>Explore</Text>
        <Ionicons name="arrow-forward" size={14} color={"#1A1A1A"} />
      </View>
    </TouchableOpacity>
  );

  const handleRequestToJoin = (rideId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

    // Convert ride ID to valid UUID using utility function
    const mappedId = getValidRideId(rideId);

    // Check wallet balance
    if (!wallet || wallet.balance <= 0) {
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

    // Navigate to ride booking page
    router.push(`/(app)/[book-ride]?id=${mappedId}`);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.topSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={"#1A1A1A"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <DebugScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.welcomeText}>Good to see you, {profile?.full_name || 'Explorer'}!</Text>
          <Text style={styles.welcomeSubtitle}>Ready for your next adventure?</Text>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={"#6B7280"} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={"#9CA3AF"}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={"#9CA3AF"} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filters */}
          <View style={styles.quickFilters}>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="location" size={14} color={"#FFD700"} />
              <Text style={styles.filterChipText}>Near Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="time" size={14} color={"#FFD700"} />
              <Text style={styles.filterChipText}>Popular</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="pricetag" size={14} color={"#FFD700"} />
              <Text style={styles.filterChipText}>Best Price</Text>
            </TouchableOpacity>
          </View>

          {/* Category Pills */}
          <DebugScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === category.id && styles.categoryPillActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.id ? "#1A1A1A" : "#FFD700"}
                />
                <Text style={[
                  styles.categoryPillText,
                  selectedCategory === category.id && styles.categoryPillTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </DebugScrollView>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity onPress={() => router.push(`/(app)/destination?category=${selectedCategory === 'all' ? 'central' : selectedCategory}`)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredDestinations}
            renderItem={renderDestination}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destinationsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Trending Routes - now using real rides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Routes</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/my-rides')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {allRides.length > 0 ? (
            <FlatList
              data={allRides}
              renderItem={({ item }: any) => (
                <OptimizedRideCard
                  ride={item}
                  onPress={() => handleRequestToJoin(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routesList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Text style={{ textAlign: 'center', color: '#6B7280' }}>No rides available right now.</Text>
          )}
        </View>

        {/* CTA Card */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/(app)/create-ride')}
          activeOpacity={0.9}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Create Your Own Ride</Text>
            <Text style={styles.ctaSubtitle}>Share your journey with co-travelers</Text>
          </View>
          <View style={styles.ctaButton}>
            <Ionicons name="add" size={24} color={"#1A1A1A"} />
          </View>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </DebugScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topSpacer: {
    height: 48,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: "#1A1A1A",
  },
  headerSpacer: {
    width: 44,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  createRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createRideText: {
    fontSize: 14,
    fontWeight: '600',
    color: "#1A1A1A",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6B7280",
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: "#1A1A1A",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 4,
    marginBottom: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: "#374151",
  },
  categoryContainer: {
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,215,0,0.15)',
    marginRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: "#FFD700",
  },
  categoryPillTextActive: {
    color: "#1A1A1A",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#6B7280",
  },
  compactHero: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  compactHeroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: "#1A1A1A",
    marginBottom: 4,
  },
  compactHeroSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: "#1A1A1A",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: "#FFD700",
  },
  destinationsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  separator: {
    width: 12,
  },

  // Destination Card (premium)
  destinationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  destTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  destIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  destNameWrap: {
    flex: 1,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '600',
    color: "#1A1A1A",
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 11,
    color: '#78716C',
  },
  destChips: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  destChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#44403C',
  },
  destCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 8,
    gap: 4,
  },
  destCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: "#1A1A1A",
  },

  // Trending Route Card helper container
  routesList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // CTA Button
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#FFD700",
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
    color: "#1A1A1A",
  },
  ctaBtnTextDisabled: {
    color: '#A8A29E',
  },
  ctaCard: {
    marginHorizontal: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaContent: {
    flex: 1,
    marginRight: 16,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: "#FFFFFF",
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
