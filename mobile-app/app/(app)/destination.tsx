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

// local alias for commonly used theme values - keeps legacy BRAND usage intact
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

const { width } = Dimensions.get('window');

// Categories configuration
const categories = {
  airport: {
    label: 'Airport',
    icon: 'airplane-outline',
    description: 'Airport terminals and aviation hubs',
    color: '#3B82F6',
  },
  it: {
    label: 'IT Parks',
    icon: 'business-outline',
    description: 'Technology parks and IT campuses',
    color: '#8B5CF6',
  },
  central: {
    label: 'Central',
    icon: 'location-outline',
    description: 'Central business districts and popular areas',
    color: '#F59E0B',
  },
  tourist: {
    label: 'Tourist',
    icon: 'camera-outline',
    description: 'Tourist attractions and landmarks',
    color: '#10B981',
  },
};

// All destinations data
const allDestinations = [
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

  // Central destinations
  { id: '13', name: 'MG Road', address: 'Central Business District', rides: 234, category: 'central', rating: 4.6 },
  { id: '14', name: 'Brigade Road', address: 'Shopping & Entertainment Hub', rides: 198, category: 'central', rating: 4.5 },
  { id: '15', name: 'Commercial Street', address: 'Historic Shopping Area', rides: 165, category: 'central', rating: 4.4 },
  { id: '16', name: 'Koramangala', address: 'Startup & Restaurant Hub', rides: 256, category: 'central', rating: 4.7 },
  { id: '17', name: 'Indiranagar', address: '100ft Road, Lifestyle Zone', rides: 189, category: 'central', rating: 4.6 },
  { id: '18', name: 'HSR Layout', address: 'Residential & Cafe Hub', rides: 145, category: 'central', rating: 4.5 },
  { id: '19', name: 'Jayanagar', address: '4th Block, South Bangalore', rides: 134, category: 'central', rating: 4.4 },
  { id: '20', name: 'Marathahalli', address: 'ORR Junction', rides: 178, category: 'central', rating: 4.3 },

  // Tourist destinations
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

export default function DestinationScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryData = categories[category as keyof typeof categories];
  
  if (!categoryData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </SafeAreaView>
    );
  }

  const filteredDestinations = useMemo(() => {
    return allDestinations.filter((dest) => {
      const matchesCategory = dest.category === category;
      const matchesSearch = searchQuery === '' || 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, searchQuery]);

  const renderDestination = ({ item }: any) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => router.push(`/(app)/destination-detail?id=${item.id}`)}
      activeOpacity={0.92}
    >
      {/* Top: Icon + Name */}
      <View style={styles.destTopRow}>
        <View style={[styles.destIcon, { backgroundColor: categoryData.color + '20' }]}>
          <Ionicons name="location" size={18} color={categoryData.color} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryData.label} Destinations</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: categoryData.color + '10' }]}>
        <View style={styles.heroIcon}>
          <Ionicons name={categoryData.icon as any} size={32} color={categoryData.color} />
        </View>
        <Text style={styles.heroTitle}>{categoryData.label}</Text>
        <Text style={styles.heroDescription}>{categoryData.description}</Text>
        <Text style={styles.heroCount}>{filteredDestinations.length} destinations</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={BRAND.yellow} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${categoryData.label.toLowerCase()} destinations...`}
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
        {/* Destinations Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular {categoryData.label} Destinations</Text>
          <FlatList
            data={filteredDestinations}
            renderItem={renderDestination}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.destinationsRow}
            contentContainerStyle={styles.destinationsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

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
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroCount: {
    fontSize: 12,
    color: BRAND.gray,
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
    marginBottom: 16,
  },
  destinationsList: {
    paddingHorizontal: 16,
  },
  destinationsRow: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 12,
  },

  // Destination Card
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

  errorText: {
    fontSize: 16,
    color: BRAND.red,
    textAlign: 'center',
    marginTop: 50,
  },
});
