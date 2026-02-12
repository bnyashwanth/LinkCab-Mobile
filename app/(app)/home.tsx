import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../contexts/PaymentContext';
import { useRide } from '../../contexts/RideContext';
import LinkCabLogo from '../../components/LinkCabLogo';

const DEMO_RIDES = [
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
  }
];

const categories = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'airport', label: 'Airport', icon: 'airplane-outline' },
  { id: 'it', label: 'IT Parks', icon: 'business-outline' },
  { id: 'central', label: 'Central', icon: 'location-outline' },
  { id: 'tourist', label: 'Tourist', icon: 'camera-outline' },
];

const quickActions = [
  { id: 'create', label: 'Create Ride', icon: 'add-circle-outline', route: '/(app)/create-ride' },
  { id: 'find', label: 'Find Ride', icon: 'search-outline', route: '/(app)/discover' },
  { id: 'announcements', label: 'My Announcements', icon: 'megaphone-outline', route: '/(app)/announcements' },
  { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline', route: '/(app)/emergency' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { wallet } = usePayment();
  const { rides: contextRides, loading } = useRide();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handleRequestToJoin = async (rideId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

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

    router.push(`/(app)/[book-ride]?id=${rideId}`);
  };

  const renderRide = ({ item }: any) => {
    const initials = item.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/(app)/[book-ride]?id=${item.id}`)}
        activeOpacity={0.92}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>{initials}</Text>
              {item.user?.verified && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color={colors.background.primary} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.driverName} numberOfLines={1}>{item.user?.name || 'Unknown Driver'}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={11} color={'#F59E0B'} />
                <Text style={styles.ratingText}>{item.user?.rating || '4.5'}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusPill, item.status === 'pending' ? styles.statusPillAvailable : styles.statusPillBooked]}>
            <View style={[styles.statusDot, item.status === 'pending' ? styles.dotAvailable : styles.dotBooked]} />
            <Text style={[styles.statusPillText, item.status === 'pending' ? styles.statusPillTextAvailable : styles.statusPillTextBooked]}>
              {item.status === 'pending' ? 'Available' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address}</Text>
          <View style={styles.routeConnector}>
            <View style={styles.dashedLine} />
          </View>
          <Text style={styles.routeText} numberOfLines={1}>{item.dropoff_address}</Text>
        </View>

        <View style={styles.rideMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.metaText}>{item.ride_date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.metaText}>{item.ride_time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="car-sport-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.metaText}>{item.cab_type}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.requestBtn,
            (!wallet || wallet.balance < 1) && styles.requestBtnDisabled
          ]}
          disabled={!wallet || wallet.balance < 1}
          onPress={() => handleRequestToJoin(item.id)}
        >
          <Text style={[
            styles.requestBtnText,
            (!wallet || wallet.balance < 1) && styles.requestBtnTextDisabled
          ]}>
            {!wallet || wallet.balance < 1 ? 'Top Up Required' : 'Request to Join'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinkCabLogo size="small" style={styles.logoComponent} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.walletContainer}>
            <Ionicons name="wallet-outline" size={20} color={colors.text.primary} />
            <Text style={styles.walletText}>₹{wallet?.balance || 0}</Text>
          </View>
        </View>
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Find your perfect ride</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Where do you want to go?"
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickAction}
              onPress={() => router.push(action.route)}
            >
              <Ionicons name={action.icon as any} size={24} color={colors.secondary[500]} />
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rides</Text>
          <FlatList
            data={DEMO_RIDES}
            renderItem={renderRide}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.ridesList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={48} color={colors.gray[500]} />
                <Text style={styles.emptyTitle}>No rides found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
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
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
    paddingTop: Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 0) + 4,
  },
  headerLeft: {
    flex: 1,
  },
  logoComponent: {
    width: 120,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger[500],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: '600',
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  searchSection: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  content: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 20,
  },
  quickAction: {
    width: '48%',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  ridesList: {
    gap: 12,
  },
  rideCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
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
    marginRight: 12,
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
    gap: 4,
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
  routeInfo: {
    marginBottom: 12,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  routeConnector: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
  },
  dashedLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.gray[300],
    borderRadius: 1,
  },
  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  requestBtn: {
    backgroundColor: colors.secondary[500],
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  requestBtnDisabled: {
    backgroundColor: colors.gray[300],
  },
  requestBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  requestBtnTextDisabled: {
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
});
