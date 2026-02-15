import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ScrollView, Alert, TextInput, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useRide } from '@/contexts/RideContext';
import { getValidRideId } from '@/utils/rideIdUtils';

const { width } = Dimensions.get('window');

// ... (Keep categories and popularDestinations arrays exactly as they were - hidden for brevity but include them in your file) ...
const categories = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'airport', label: 'Airport', icon: 'airplane-outline' },
  { id: 'it', label: 'IT Parks', icon: 'business-outline' },
  { id: 'central', label: 'Central', icon: 'location-outline' },
  { id: 'tourist', label: 'Tourist', icon: 'camera-outline' },
];

// Re-paste your popularDestinations array here...
const popularDestinations = [
  { id: '1', name: 'Kempegowda Airport T1', address: 'Terminal 1, International Airport', rides: 256, category: 'airport', rating: 4.9 },
  // ... rest of your items ...
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
      <View style={styles.destTopRow}>
        <View style={styles.destIcon}>
          <Ionicons name="location" size={18} color={"#1A1A1A"} />
        </View>
        <View style={styles.destNameWrap}>
          <Text style={styles.destinationName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.destinationAddress} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>
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
    const mappedId = getValidRideId(rideId);
    if (!wallet || wallet.balance <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'Please top up your wallet to send ride requests.\n\nMinimum balance required: ₹1',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up Wallet', style: 'default', onPress: () => router.push('/(app)/wallet') },
        ]
      );
      return;
    }
    router.push(`/(app)/[book-ride]?id=${mappedId}`);
  };

  return (
    // FIXED: Added edges={['top']} so the content starts BELOW the status bar
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* FIXED: Removed the <View style={styles.topSpacer} /> */}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={"#1A1A1A"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
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

          {allRides.length > 0 ? (
            <FlatList
              data={allRides}
              renderItem={({ item }: any) => {
                const initials = (item.pickup_address || 'R')[0].toUpperCase();
                return (
                  <TouchableOpacity
                    style={styles.rideCard}
                    onPress={() => handleRequestToJoin(item.id)}
                    activeOpacity={0.92}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.driverRow}>
                        <View style={styles.driverAvatar}>
                          <Text style={styles.driverInitials}>{initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.driverName} numberOfLines={1}>Ride Announcement</Text>
                          <View style={styles.driverMeta}>
                            <Ionicons name="time-outline" size={11} color={'#6B7280'} />
                            <Text style={styles.ratingText}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.statusPill, styles.statusPillAvailable]}>
                        <View style={[styles.statusDot, styles.dotAvailable]} />
                        <Text style={[styles.statusPillText, styles.statusPillTextAvailable]}>Available</Text>
                      </View>
                    </View>

                    <View style={styles.routeTimeline}>
                      <View style={styles.timelineRow}>
                        <View style={styles.timelineMarker}><View style={styles.timelineDotGreen} /></View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineLabel}>PICKUP</Text>
                          <Text style={styles.timelineAddress} numberOfLines={1}>{item.pickup_address || 'Not specified'}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineConnector}><View style={styles.dashedLine} /></View>
                      <View style={styles.timelineRow}>
                        <View style={styles.timelineMarker}><View style={styles.timelineDotRed} /></View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineLabel}>DROP-OFF</Text>
                          <Text style={styles.timelineAddress} numberOfLines={1}>{item.dropoff_address || 'Not specified'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.infoChipsRow}>
                      {item.ride_date && (
                        <View style={styles.infoChip}>
                          <Ionicons name="calendar-outline" size={13} color={"#1A1A1A"} />
                          <Text style={styles.infoChipText}>{item.ride_date}</Text>
                        </View>
                      )}
                      {item.ride_time && (
                        <View style={styles.infoChip}>
                          <Ionicons name="time-outline" size={13} color={"#1A1A1A"} />
                          <Text style={styles.infoChipText}>{item.ride_time}</Text>
                        </View>
                      )}
                      <View style={styles.infoChip}>
                        <Ionicons name="people-outline" size={13} color={"#1A1A1A"} />
                        <Text style={styles.infoChipText}>{item.available_seats ?? 1} seat(s)</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.ctaBtn,
                        (!wallet || wallet.balance <= 0) && styles.ctaBtnDisabled
                      ]}
                      disabled={!wallet || wallet.balance <= 0}
                      onPress={() => handleRequestToJoin(item.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[
                        styles.ctaBtnText,
                        (!wallet || wallet.balance <= 0) && styles.ctaBtnTextDisabled
                      ]}>
                        {(!wallet || wallet.balance <= 0) ? 'Top Up Required' : 'Request to Join · ₹1'}
                      </Text>
                      {(wallet && wallet.balance > 0) && <Ionicons name="arrow-forward" size={16} color={"#1A1A1A"} />}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item: any) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.routesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={colors.gray[500]} />
              <Text style={styles.emptyTitle}>No rides available yet</Text>
              <Text style={styles.emptySubtitle}>Create a ride or check back later</Text>
            </View>
          )}
        </View>

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

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (Copy all your styles here exactly as they were, NO CHANGES needed in styles object) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // FIXED: Removed topSpacer style usage, but keep the object if other things rely on it (or just delete it)
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
  // ... (Paste the rest of your styles here) ...
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
  routesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  rideCard: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFD700",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: "#1A1A1A",
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: "#1A1A1A",
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: { backgroundColor: '#16A34A' },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillTextAvailable: { color: '#16A34A' },
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
    color: "#1A1A1A",
  },
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});