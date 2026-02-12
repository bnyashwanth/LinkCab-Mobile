import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { usePayment } from '@/contexts/PaymentContext';
import { Ride } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

// Brand Colors
const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF8DC',
  yellowSoft: '#FFFDF0',
  yellowDark: '#E6C200',
  yellowGlow: 'rgba(255, 215, 0, 0.15)',
  black: '#1A1A1A',
  blackLight: '#333333',
  blackSoft: '#2D2D2D',
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  gray: '#6B7280',
  grayLight: '#F5F5F5',
  grayMedium: '#E5E7EB',
  grayDark: '#9CA3AF',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  red: '#EF4444',
  redLight: '#FEE2E2',
};

// Demo ride data
const DEMO_RIDES: { [key: string]: Ride } = {
  'demo1': {
    id: 'demo1',
    rider_id: 'user1',
    driver_id: 'driver1',
    pickup_latitude: 12.9716,
    pickup_longitude: 77.5946,
    pickup_address: 'Koramangala 4th Block, Bangalore',
    dropoff_latitude: 13.1986,
    dropoff_longitude: 77.7066,
    dropoff_address: 'Bangalore Airport Terminal 1',
    status: 'pending',
    ride_date: '2026-02-15',
    ride_time: '6:30 AM',
    available_seats: 2,
    cab_type: 'sedan',
    fare: 550,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Rahul Sharma',
      rating: 4.8,
      verified: true
    }
  },
  'demo2': {
    id: 'demo2',
    rider_id: 'user2',
    driver_id: 'driver2',
    pickup_latitude: 12.9784,
    pickup_longitude: 77.6408,
    pickup_address: 'Indiranagar 100ft Road',
    dropoff_latitude: 12.8452,
    dropoff_longitude: 77.6769,
    dropoff_address: 'Electronic City Phase 1',
    status: 'active',
    ride_date: '2026-02-15',
    ride_time: '8:00 AM',
    available_seats: 4,
    cab_type: 'suv',
    fare: 450,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Priya Patel',
      rating: 4.9,
      verified: true
    }
  },
  'demo3': {
    id: 'demo3',
    rider_id: 'user3',
    driver_id: 'driver3',
    pickup_latitude: 12.9791,
    pickup_longitude: 77.5916,
    pickup_address: 'MG Road Metro Station',
    dropoff_latitude: 12.9698,
    dropoff_longitude: 77.7499,
    dropoff_address: 'Whitefield IT Hub',
    status: 'pending',
    ride_date: '2026-02-16',
    ride_time: '9:00 AM',
    available_seats: 1,
    cab_type: 'sedan',
    fare: 380,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Amit Kumar',
      rating: 4.5,
      verified: true
    }
  },
  'demo4': {
    id: 'demo4',
    rider_id: 'user4',
    driver_id: 'driver4',
    pickup_latitude: 12.9143,
    pickup_longitude: 77.6344,
    pickup_address: 'HSR Layout Sector 1',
    dropoff_latitude: 12.9569,
    dropoff_longitude: 77.7009,
    dropoff_address: 'Marathahalli Bridge',
    status: 'active',
    ride_date: '2026-02-16',
    ride_time: '10:30 AM',
    available_seats: 3,
    cab_type: 'hatchback',
    fare: 280,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Sneha Gupta',
      rating: 4.7,
      verified: true
    }
  },
  'demo5': {
    id: 'demo5',
    rider_id: 'user5',
    driver_id: 'driver5',
    pickup_latitude: 12.9308,
    pickup_longitude: 77.5838,
    pickup_address: 'Jayanagar 4th Block',
    dropoff_latitude: 12.9764,
    dropoff_longitude: 77.5714,
    dropoff_address: 'Majestic Bus Stand',
    status: 'pending',
    ride_date: '2026-02-17',
    ride_time: '7:15 AM',
    available_seats: 2,
    cab_type: 'auto',
    fare: 150,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Vikram Singh',
      rating: 4.6,
      verified: true
    }
  },
  'demo6': {
    id: 'demo6',
    rider_id: 'user6',
    driver_id: 'driver6',
    pickup_latitude: 12.9166,
    pickup_longitude: 77.6101,
    pickup_address: 'BTM Layout 2nd Stage',
    dropoff_latitude: 12.9345,
    dropoff_longitude: 77.6142,
    dropoff_address: 'Koramangala 1st Block',
    status: 'active',
    ride_date: '2026-02-17',
    ride_time: '8:45 AM',
    available_seats: 2,
    cab_type: 'sedan',
    fare: 120,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Anjali Desai',
      rating: 4.9,
      verified: true
    }
  },
  'demo7': {
    id: 'demo7',
    rider_id: 'user7',
    driver_id: 'driver7',
    pickup_latitude: 12.9179,
    pickup_longitude: 77.6232,
    pickup_address: 'Silk Board Junction',
    dropoff_latitude: 12.8440,
    dropoff_longitude: 77.6772,
    dropoff_address: 'Electronic City Phase 2',
    status: 'pending',
    ride_date: '2026-02-18',
    ride_time: '9:30 AM',
    available_seats: 2,
    cab_type: 'hatchback',
    fare: 320,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Rohit Verma',
      rating: 4.3,
      verified: false
    }
  },
  'demo8': {
    id: 'demo8',
    rider_id: 'user8',
    driver_id: 'driver8',
    pickup_latitude: 13.0238,
    pickup_longitude: 77.5964,
    pickup_address: 'Hebbal Flyover',
    dropoff_latitude: 13.0624,
    dropoff_longitude: 77.6532,
    dropoff_address: 'Manyata Tech Park',
    status: 'active',
    ride_date: '2026-02-18',
    ride_time: '6:00 PM',
    available_seats: 2,
    cab_type: 'sedan',
    fare: 280,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Kavita Reddy',
      rating: 4.8,
      verified: true
    }
  },
  'demo9': {
    id: 'demo9',
    rider_id: 'user9',
    driver_id: 'driver9',
    pickup_latitude: 12.9116,
    pickup_longitude: 77.5984,
    pickup_address: 'Bannerghatta Road',
    dropoff_latitude: 12.8440,
    dropoff_longitude: 77.6772,
    dropoff_address: 'Electronic City',
    status: 'active',
    ride_date: '2026-02-19',
    ride_time: '7:30 AM',
    available_seats: 5,
    cab_type: 'suv',
    fare: 420,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Arjun Nair',
      rating: 5.0,
      verified: true
    }
  },
  'demo10': {
    id: 'demo10',
    rider_id: 'user10',
    driver_id: 'driver10',
    pickup_latitude: 12.9081,
    pickup_longitude: 77.6596,
    pickup_address: 'HSR Layout to Airport',
    dropoff_latitude: 13.1979,
    dropoff_longitude: 77.7066,
    dropoff_address: 'Kempegowda Airport T2',
    status: 'pending',
    ride_date: '2026-02-19',
    ride_time: '5:00 AM',
    available_seats: 3,
    cab_type: 'sedan',
    fare: 680,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Meera Iyer',
      rating: 4.7,
      verified: true
    }
  },
  'demo11': {
    id: 'demo11',
    rider_id: 'user11',
    driver_id: 'driver11',
    pickup_latitude: 13.0033,
    pickup_longitude: 77.5837,
    pickup_address: 'Sadashivanagar',
    dropoff_latitude: 12.9698,
    dropoff_longitude: 77.7499,
    dropoff_address: 'Whitefield',
    status: 'active',
    ride_date: '2026-02-20',
    ride_time: '8:15 AM',
    available_seats: 3,
    cab_type: 'sedan',
    fare: 380,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Suresh Babu',
      rating: 4.2,
      verified: false
    }
  },
  'demo12': {
    id: 'demo12',
    rider_id: 'user12',
    driver_id: 'driver12',
    pickup_latitude: 12.9542,
    pickup_longitude: 77.6313,
    pickup_address: 'Domlur',
    dropoff_latitude: 12.9569,
    dropoff_longitude: 77.7009,
    dropoff_address: 'Marathahalli',
    status: 'pending',
    ride_date: '2026-02-20',
    ride_time: '9:45 AM',
    available_seats: 2,
    cab_type: 'hatchback',
    fare: 180,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Divya Rao',
      rating: 4.6,
      verified: true
    }
  },
  'demo13': {
    id: 'demo13',
    rider_id: 'user13',
    driver_id: 'driver13',
    pickup_latitude: 13.0163,
    pickup_longitude: 77.5536,
    pickup_address: 'Rajajinagar',
    dropoff_latitude: 13.1979,
    dropoff_longitude: 77.7066,
    dropoff_address: 'Bangalore Airport',
    status: 'active',
    ride_date: '2026-02-21',
    ride_time: '4:30 AM',
    available_seats: 4,
    cab_type: 'suv',
    fare: 750,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Michael Thomas',
      rating: 4.7,
      verified: true
    }
  },
  'demo14': {
    id: 'demo14',
    rider_id: 'user14',
    driver_id: 'driver14',
    pickup_latitude: 12.9418,
    pickup_longitude: 77.5666,
    pickup_address: 'Basavanagudi',
    dropoff_latitude: 12.9345,
    dropoff_longitude: 77.6142,
    dropoff_address: 'Koramangala',
    status: 'pending',
    ride_date: '2026-02-21',
    ride_time: '7:00 AM',
    available_seats: 2,
    cab_type: 'auto',
    fare: 100,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'Lakshmi Narayan',
      rating: 4.4,
      verified: true
    }
  },
  'demo15': {
    id: 'demo15',
    rider_id: 'user15',
    driver_id: 'driver15',
    pickup_latitude: 13.0138,
    pickup_longitude: 77.6328,
    pickup_address: 'Frazer Town',
    dropoff_latitude: 12.9784,
    dropoff_longitude: 77.6408,
    dropoff_address: 'Indiranagar',
    status: 'active',
    ride_date: '2026-02-22',
    ride_time: '6:15 PM',
    available_seats: 2,
    cab_type: 'hatchback',
    fare: 150,
    currency: 'INR',
    payment_method: 'razorpay',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      name: 'David Wilson',
      rating: 4.5,
      verified: false
    }
  },
};

const getCabIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'suv': return 'car-sport';
    case 'sedan': return 'car';
    case 'hatchback': return 'car-outline';
    case 'auto': return 'bicycle';
    default: return 'car';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'accepted':
      return '#22C55E';
    case 'completed':
      return '#6B7280';
    case 'cancelled':
      return '#EF4444';
    case 'pending':
      return '#F59E0B';
    case 'in_progress':
      return '#3B82F6';
    case 'booked':
      return '#8B5CF6';
    default:
      return '#6B7280';
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

export default function BookRideScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { requestRide, rides } = useRide();
  const { wallet, deductRequestFee } = usePayment();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
    setLoading(true);
    
    // First try to find the ride in real rides data
    if (id && rides) {
      const foundRide = rides.find(r => r.id === id);
      if (foundRide) {
        setRide(foundRide);
        setLoading(false);
        return;
      }
    }
    
    // Fallback to demo data if no real ride found
    if (id && DEMO_RIDES[id as string]) {
      setRide(DEMO_RIDES[id as string]);
    }
    
    setLoading(false);
  }, [id, rides]);

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleRequestRide = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to request a ride');
      return;
    }

    if (!ride) {
      Alert.alert('Error', 'Ride not found');
      return;
    }

    if (!wallet || wallet?.balance <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'Please top up your wallet to send ride requests.\n\nMinimum balance required: ₹1',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Top Up Wallet',
            style: 'default',
            onPress: () => router.push('/(app)/wallet'),
          },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const feeResult = await deductRequestFee(ride.id);

      if (feeResult.error) {
        Alert.alert('Error', feeResult.error.message || 'Failed to process request fee');
        return;
      }

      const requestResult = await requestRide(ride.id);

      if (requestResult.error) {
        Alert.alert('Error', requestResult.error.message || 'Failed to send ride request');
        return;
      }

      Alert.alert(
        'Request Sent! 🎉',
        'Your ride request has been sent to the driver. You can chat with them once they accept your request.',
        [
          {
            text: 'View Requests',
            style: 'default',
            onPress: () => router.push('/(app)/requests'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Request ride error:', error);
      Alert.alert('Error', 'Failed to send ride request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={BRAND.yellow} />
          </View>
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle" size={48} color={BRAND.red} />
          </View>
          <Text style={styles.errorTitle}>Ride Not Found</Text>
          <Text style={styles.errorSubtitle}>This ride may have been removed or is no longer available.</Text>
          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={BRAND.black} />
            <Text style={styles.errorBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAvailable = ride.status === 'pending' || ride.status === 'active';
  const isOwnRide = user && ride.rider_id === user.id;
  const initials = ride.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';
  const canRequest = isAvailable && wallet && wallet?.balance > 0 && !isOwnRide;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isOwnRide ? 'Your Ride' : 'Ride Details'}</Text>
        <View style={styles.headerRight}>
          {isOwnRide ? null : (
            <View style={[styles.statusPill, isAvailable ? styles.statusPillAvailable : styles.statusPillUnavailable]}>
              <View style={[styles.statusDot, isAvailable ? styles.statusDotGreen : styles.statusDotRed]} />
              <Text style={[styles.statusPillText, isAvailable ? styles.statusPillTextGreen : styles.statusPillTextRed]}>
                {isAvailable ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isOwnRide ? null : (
          // Original Fare Hero Banner for other rides
          <View style={styles.fareHero}>
            <LinearGradient
              colors={[BRAND.yellow, BRAND.yellowDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fareGradient}
            >
              <View style={styles.fareTop}>
                <View style={styles.fareLabelRow}>
                  <Ionicons name="pricetag" size={16} color={BRAND.black} />
                  <Text style={styles.fareLabel}>Estimated Fare</Text>
                </View>
                <View style={styles.cabTypePill}>
                  <Ionicons name={getCabIcon(ride.cab_type || '') as any} size={14} color={BRAND.black} />
                  <Text style={styles.cabTypeText}>
                    {(ride.cab_type ?? '').charAt(0).toUpperCase() + (ride.cab_type ?? '').slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.fareAmountRow}>
                <Text style={styles.fareCurrency}>₹</Text>
                <Text style={styles.fareAmount}>{ride.fare}</Text>
                <Text style={styles.farePerSeat}>/ seat</Text>
              </View>
              <View style={styles.fareBottom}>
                <View style={styles.fareChip}>
                  <Ionicons name="people" size={13} color={BRAND.black} />
                  <Text style={styles.fareChipText}>{ride.available_seats} seats left</Text>
                </View>
                <View style={styles.fareChip}>
                  <Ionicons name="navigate" size={13} color={BRAND.black} />
                  <Text style={styles.fareChipText}>~25 km</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {isOwnRide ? null : (
          // Original Driver Card for other rides
          <TouchableOpacity
            style={styles.driverCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(app)/ride-creator-profile', params: { id: ride.rider_id } })}
          >
            <View style={styles.driverRow}>
              <View style={styles.driverAvatarWrap}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitials}>{initials}</Text>
                </View>
                {ride.user?.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color={BRAND.white} />
                  </View>
                )}
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ride.user?.name || 'LinkCab Driver'}</Text>
                <View style={styles.driverMeta}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={13} color={BRAND.yellow} />
                    <Text style={styles.ratingText}>{ride.user?.rating || 'New'}</Text>
                  </View>
                  {ride.user?.verified && (
                    <View style={styles.verifiedPill}>
                      <Ionicons name="shield-checkmark" size={12} color={BRAND.green} />
                      <Text style={styles.verifiedPillText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.driverChevron}>
                <Ionicons name="chevron-forward" size={20} color={BRAND.grayDark} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Enhanced Route Card */}
        <View style={styles.card}>
          {/* Card Header with Icon */}
          <LinearGradient
            colors={[BRAND.yellowGlow, BRAND.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeaderGradient}
          >
            <View style={styles.cardHeaderContent}>
              <View style={styles.routeIcon}>
                <Ionicons name="map-outline" size={22} color={BRAND.yellow} />
              </View>
              <View style={styles.cardTitleSection}>
                <Text style={styles.cardTitle}>Route Details</Text>
                <Text style={styles.cardSubtitle}>Complete journey information</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Route Timeline Section */}
          <View style={styles.routeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Journey Path</Text>
              <View style={styles.sectionDivider} />
            </View>

            <View style={styles.modernRouteContainer}>
              <View style={styles.routePoint}>
                <View style={styles.routePointMarker}>
                  <Ionicons name="location" size={18} color={BRAND.green} />
                </View>
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>Pickup Location</Text>
                  <Text style={styles.routePointAddress} numberOfLines={2}>{ride.pickup_address}</Text>
                  <View style={styles.routePointMeta}>
                    <Ionicons name="time" size={12} color={BRAND.gray} />
                    <Text style={styles.routePointTime}>{ride.ride_time}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.routeConnector}>
                <View style={styles.dashedConnector} />
              </View>

              <View style={styles.routePoint}>
                <View style={styles.routePointMarker}>
                  <Ionicons name="flag" size={18} color={BRAND.red} />
                </View>
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointLabel}>Destination</Text>
                  <Text style={styles.routePointAddress} numberOfLines={2}>{ride.dropoff_address}</Text>
                  <View style={styles.routePointMeta}>
                    <Ionicons name="navigate" size={12} color={BRAND.gray} />
                    <Text style={styles.routePointTime}>~25 km</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Trip Details Section */}
          <View style={styles.tripDetailsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trip Information</Text>
              <View style={styles.sectionDivider} />
            </View>

            <View style={styles.tripInfoContainer}>
              <View style={styles.tripInfoPill}>
                <Ionicons name="calendar" size={16} color={BRAND.black} />
                <Text style={styles.tripInfoText}>{ride.ride_date}</Text>
              </View>
              <View style={styles.tripInfoPill}>
                <Ionicons name="car" size={16} color={BRAND.black} />
                <Text style={styles.tripInfoText}>{(ride.cab_type ?? '').charAt(0).toUpperCase() + (ride.cab_type ?? '').slice(1)}</Text>
              </View>
              <View style={styles.tripInfoPill}>
                <Ionicons name="people" size={16} color={BRAND.black} />
                <Text style={styles.tripInfoText}>{ride.available_seats} seats</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Requests Section */}
        {isOwnRide && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.requestsIcon}>
                  <Ionicons name="people-outline" size={20} color={BRAND.black} />
                </View>
                <View style={styles.requestsTitleSection}>
                  <Text style={styles.cardTitle}>Join Requests</Text>
                  <Text style={styles.requestsSubtitle}>Manage who joins your ride</Text>
                </View>
              </View>
              <View style={styles.requestCount}>
                <Text style={styles.requestCountText}>3 Active</Text>
              </View>
            </View>

            {/* Request List */}
            <View style={styles.requestsList}>
              {/* Request Item 1 */}
              <View style={styles.requestItem}>
                <View style={styles.requesterAvatar}>
                  <LinearGradient
                    colors={[BRAND.yellow, BRAND.yellowDark]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.requesterInitials}>AS</Text>
                  </LinearGradient>
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.requesterInfo}>
                  <Text style={styles.requesterName}>Amit Sharma</Text>
                  <View style={styles.requesterMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color={BRAND.yellow} />
                      <Text style={styles.requesterRating}>4.8</Text>
                    </View>
                    <Text style={styles.requestSeparator}>•</Text>
                    <Text style={styles.requestTime}>2 hours ago</Text>
                  </View>
                  <View style={styles.requesterTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Verified</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Regular</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Ionicons name="checkmark" size={16} color={BRAND.white} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton}>
                    <Ionicons name="close" size={16} color={BRAND.gray} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Request Item 2 */}
              <View style={styles.requestItem}>
                <View style={styles.requesterAvatar}>
                  <LinearGradient
                    colors={[BRAND.yellow, BRAND.yellowDark]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.requesterInitials}>PK</Text>
                  </LinearGradient>
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.requesterInfo}>
                  <Text style={styles.requesterName}>Priya Kumar</Text>
                  <View style={styles.requesterMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color={BRAND.yellow} />
                      <Text style={styles.requesterRating}>4.9</Text>
                    </View>
                    <Text style={styles.requestSeparator}>•</Text>
                    <Text style={styles.requestTime}>5 hours ago</Text>
                  </View>
                  <View style={styles.requesterTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Verified</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Premium</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Ionicons name="checkmark" size={16} color={BRAND.white} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton}>
                    <Ionicons name="close" size={16} color={BRAND.gray} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Request Item 3 */}
              <View style={styles.requestItem}>
                <View style={styles.requesterAvatar}>
                  <LinearGradient
                    colors={[BRAND.yellow, BRAND.yellowDark]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.requesterInitials}>RJ</Text>
                  </LinearGradient>
                </View>
                <View style={styles.requesterInfo}>
                  <Text style={styles.requesterName}>Rahul Jain</Text>
                  <View style={styles.requesterMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color={BRAND.yellow} />
                      <Text style={styles.requesterRating}>4.7</Text>
                    </View>
                    <Text style={styles.requestSeparator}>•</Text>
                    <Text style={styles.requestTime}>1 day ago</Text>
                  </View>
                  <View style={styles.requesterTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>New</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity style={[styles.acceptButton, styles.acceptButtonDisabled]} disabled={true}>
                    <Text style={[styles.acceptButtonText, styles.acceptButtonTextGreen]}>Accepted</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={BRAND.gray} />
          <Text style={styles.safetyText}>
            All rides are verified. Your request fee is refunded if the driver doesn't respond within 24 hours.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          {isOwnRide ? (
            // Show management options for your own ride
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  !isAvailable && styles.ctaDisabled,
                ]}
                onPress={() => router.push(`/(app)/edit-ride?id=${ride.id}`)}
                onPressIn={() => animateButton(0.97)}
                onPressOut={() => animateButton(1)}
                activeOpacity={0.9}
              >
                <Ionicons name="create" size={20} color={BRAND.black} />
                <Text style={styles.ctaText}>Edit Ride</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (!wallet || wallet?.balance <= 0) && isAvailable ? (
            <>
              <TouchableOpacity
                style={[styles.ctaButton, styles.ctaDisabled]}
                disabled={true}
              >
                <Ionicons name="lock-closed" size={18} color={BRAND.gray} />
                <Text style={styles.ctaTextDisabled}>Top Up Required</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topUpButton}
                onPress={() => router.push('/(app)/wallet')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={18} color={BRAND.white} />
                <Text style={styles.topUpText}>Add Funds to Wallet</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  !isAvailable && styles.ctaDisabled,
                ]}
                disabled={!canRequest || submitting}
                onPress={handleRequestRide}
                onPressIn={() => animateButton(0.97)}
                onPressOut={() => animateButton(1)}
                activeOpacity={0.9}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={BRAND.black} />
                ) : (
                  <>
                    <Ionicons
                      name={isAvailable ? 'send' : 'close-circle'}
                      size={20}
                      color={isAvailable ? BRAND.black : BRAND.gray}
                    />
                    <Text style={[
                      styles.ctaText,
                      !isAvailable && styles.ctaTextDisabled,
                    ]}>
                      {isAvailable ? 'Request to Join' : 'Ride Unavailable'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          {!isAvailable && !isOwnRide && (
            <Text style={styles.closedHint}>This ride is currently not accepting requests</Text>
          )}
          {isOwnRide && !isAvailable && (
            <Text style={styles.closedHint}>This ride is {ride.status} - you can still edit details</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ─── Header ──────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    letterSpacing: -0.3,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusPillAvailable: {
    backgroundColor: BRAND.greenLight,
  },
  statusPillUnavailable: {
    backgroundColor: BRAND.redLight,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotGreen: {
    backgroundColor: BRAND.green,
  },
  statusDotRed: {
    backgroundColor: BRAND.red,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPillTextGreen: {
    color: '#15803D',
  },
  statusPillTextRed: {
    color: '#B91C1C',
  },

  // ─── Loading / Error ─────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingSpinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: BRAND.gray,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.redLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
  },

  // ─── Fare Hero ───────────────────────────────
  fareHero: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: BRAND.yellowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fareGradient: {
    padding: 20,
    borderRadius: 20,
  },
  fareTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.blackSoft,
    letterSpacing: 0.3,
  },
  cabTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  cabTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.black,
  },
  fareAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  fareCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.black,
    marginRight: 2,
  },
  fareAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: BRAND.black,
    letterSpacing: -1,
  },
  farePerSeat: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.blackSoft,
    marginLeft: 6,
  },
  fareBottom: {
    flexDirection: 'row',
    gap: 10,
  },
  fareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  fareChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },

  // ─── Driver Card ─────────────────────────────
  driverCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BRAND.yellowLight,
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: BRAND.green,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: BRAND.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.yellowSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 13,
    color: BRAND.black,
    fontWeight: '600',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedPillText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  driverChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Generic Card ────────────────────────────
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    letterSpacing: -0.2,
  },

  // ─── Route Timeline ──────────────────────────
  routeTimeline: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeMarkerCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.green,
  },
  dropoffDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropoffDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.red,
  },
  routeLine: {
    width: 2,
    height: 28,
    backgroundColor: BRAND.grayMedium,
    marginVertical: 4,
    borderRadius: 1,
  },
  routeDetail: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 6,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.grayDark,
    letterSpacing: 1,
    marginBottom: 3,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    lineHeight: 20,
  },

  // ─── Trip Grid ───────────────────────────────
  tripGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tripGridItem: {
    width: '47%' as any,
    backgroundColor: BRAND.offWhite,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  tripIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripItemLabel: {
    fontSize: 11,
    color: BRAND.gray,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripItemValue: {
    fontSize: 14,
    color: BRAND.black,
    fontWeight: '700',
  },

  // ─── Payment Card ────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  paymentItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
    marginBottom: 4,
  },
  feePill: {
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  feePillText: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.black,
  },
  paymentDivider: {
    width: 1,
    height: 40,
    backgroundColor: BRAND.grayMedium,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  balancePositive: {
    color: BRAND.green,
  },
  balanceNegative: {
    color: BRAND.red,
  },

  // ─── Status Banners ──────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.redLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  warningBannerText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.greenLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successBannerText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
    flex: 1,
  },

  // ─── Safety Note ─────────────────────────────
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  safetyText: {
    fontSize: 12,
    color: BRAND.gray,
    lineHeight: 17,
    flex: 1,
  },

  // ─── Bottom CTA ──────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND.white,
    borderTopWidth: 1,
    borderTopColor: BRAND.grayMedium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  bottomContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    gap: 10,
  },
  ctaButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.yellowDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  ctaDisabled: {
    backgroundColor: BRAND.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    letterSpacing: -0.2,
  },
  ctaTextDisabled: {
    color: BRAND.gray,
  },
  topUpButton: {
    backgroundColor: BRAND.black,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topUpText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
  },
  closedHint: {
    fontSize: 13,
    color: BRAND.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Own Ride Header Styles
  ownRideHeader: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
  },
  ownRideStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
  },
  rideId: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  // Own Ride Summary Card Styles
  ownRideSummaryCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rideSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rideSummaryInfo: {
    flex: 1,
  },
  rideSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 2,
  },
  rideSummarySubtitle: {
    fontSize: 14,
    color: BRAND.gray,
    fontWeight: '500',
  },
  rideSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: BRAND.grayMedium,
    marginHorizontal: 16,
  },
  // Request Section Styles
  requestCount: {
    backgroundColor: BRAND.yellowGlow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },
  requestsList: {
    gap: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  requesterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requesterInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
  },
  requesterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requesterRating: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.black,
  },
  requestSeparator: {
    fontSize: 12,
    color: BRAND.gray,
  },
  requestTime: {
    fontSize: 13,
    color: BRAND.gray,
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonDisabled: {
    backgroundColor: BRAND.grayLight,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  acceptButtonTextGreen: {
    color: BRAND.green,
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced UI Styles
  rideStatusSection: {
    flexDirection: 'column',
    gap: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideSummaryGradient: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  editRideButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabelAdjacent: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },
  // Enhanced Request Styles
  requestsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestsTitleSection: {
    flex: 1,
  },
  requestsSubtitle: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND.green,
    borderWidth: 2,
    borderColor: BRAND.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requesterTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: BRAND.grayLight,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND.gray,
  },
  // Enhanced Route Card Styles
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  modernRouteContainer: {
    padding: 16,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    marginVertical: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routePointMarker: {
    marginRight: 16,
    alignItems: 'center',
  },
  pickupMarker: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: BRAND.yellow,
  },
  dropoffMarker: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: BRAND.grayDark,
  },
  routePointContent: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  routePointAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 8,
    lineHeight: 22,
  },
  routePointMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routePointTime: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
  },
  routeConnector: {
    alignItems: 'center',
    marginLeft: 8,
  },
  dashedConnector: {
    width: 2,
    height: 20,
    backgroundColor: BRAND.grayMedium,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  tripInfoContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tripInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  tripInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },
  // Enhanced Card Structure Styles
  cardHeaderGradient: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeSection: {
    padding: 16,
  },
  tripDetailsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.grayLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginRight: 12,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND.grayLight,
  },
});
