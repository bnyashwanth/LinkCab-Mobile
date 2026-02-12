import React, { useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LinkCabLogo from '@/components/LinkCabLogo';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';

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
};

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

const trendingRoutes: any[] = [
  // Real rides will be fetched from database
  // This array is now empty and will be populated with real data
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet } = usePayment();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDestinations = popularDestinations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderDestination = ({ item }: any) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => router.push(`/(app)/destination?category=${item.category}`)}
      activeOpacity={0.92}
    >
      {/* Top: Icon + Name */}
      <View style={styles.destTopRow}>
        <View style={styles.destIcon}>
          <Ionicons name="location" size={18} color={BRAND.black} />
        </View>
        <View style={styles.destNameWrap}>
          <Text style={styles.destinationName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.destinationAddress} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>

      {/* Info Chips */}
      <View style={styles.destChips}>
        <View style={styles.destChip}>
          <Ionicons name="car-outline" size={12} color={BRAND.black} />
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
        <Ionicons name="arrow-forward" size={14} color={BRAND.black} />
      </View>
    </TouchableOpacity>
  );

  const handleRequestToJoin = (rideId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

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
    router.push(`/(app)/[book-ride]?id=${rideId}`);
  };

  const renderRoute = ({ item }: any) => {
    const initials = item.driver.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.rideCard}
        onPress={() => router.push(`/(app)/create-ride?from=${item.from}&to=${item.to}`)}
        activeOpacity={0.92}
      >
        {/* Top Row: Driver + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>{initials}</Text>
              {item.verified && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color={BRAND.white} />
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
            <Ionicons name="calendar-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.date}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.time}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="car-sport-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.cabType}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={13} color={BRAND.black} />
            <Text style={styles.infoChipText}>{item.seats}</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaBtn, 
            !item.available && styles.ctaBtnDisabled,
            (!wallet || wallet.balance <= 0) && styles.ctaBtnDisabled
          ]}
          disabled={!item.available || !wallet || wallet.balance <= 0}
          onPress={() => handleRequestToJoin(item.id)}
          activeOpacity={0.85}
        >
          <Text style={[
            styles.ctaBtnText, 
            !item.available && styles.ctaBtnTextDisabled,
            (!wallet || wallet.balance <= 0) && styles.ctaBtnTextDisabled
          ]}>
            {!item.available 
              ? 'Fully Booked' 
              : (!wallet || wallet.balance <= 0) 
                ? 'Top Up Required' 
                : 'Request to Join'
            }
          </Text>
          {item.available && (wallet && wallet.balance > 0) && <Ionicons name="arrow-forward" size={16} color={BRAND.black} />}
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
        <Text style={styles.headerTitle}>Discover Routes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSubtitle}>Find popular destinations and trending routes</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={BRAND.yellow} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
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

          {/* Category Pills */}
          <ScrollView
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
                  color={selectedCategory === category.id ? BRAND.black : BRAND.yellow}
                />
                <Text style={[
                  styles.categoryPillText,
                  selectedCategory === category.id && styles.categoryPillTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* Trending Routes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Routes</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/my-rides')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routesList}>
            {trendingRoutes.map((route) => (
              <View key={route.id}>
                {renderRoute({ item: route })}
              </View>
            ))}
          </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
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
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createRideText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: BRAND.gray,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
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
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.yellow,
  },
  categoryPillTextActive: {
    color: BRAND.black,
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
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  compactHero: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  compactHeroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 4,
  },
  compactHeroSubtitle: {
    fontSize: 13,
    color: BRAND.gray,
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
    color: BRAND.black,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.yellow,
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
    backgroundColor: BRAND.white,
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
    backgroundColor: BRAND.yellow,
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
    color: BRAND.black,
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
    backgroundColor: BRAND.yellow,
    borderRadius: 10,
    paddingVertical: 8,
    gap: 4,
  },
  destCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Trending Route Card (premium)
  // ── Ride Card (exact match to home page) ──
  routesList: {
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
  ctaCard: {
    marginHorizontal: 20,
    backgroundColor: BRAND.black,
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
    color: BRAND.white,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: BRAND.white,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
