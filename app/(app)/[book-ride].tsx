import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { usePayment } from '@/contexts/PaymentContext';
import { Ionicons } from '@expo/vector-icons';
import { getValidRideId } from '@/utils/rideIdUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Ride {
  id: string;
  rider_id?: string;
  driver_id?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_address: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  dropoff_address: string;
  status: string;
  ride_date: string;
  ride_time: string;
  available_seats?: number;
  cab_type?: string;
  fare?: number;
  estimated_fare?: number;
  booking_app?: string;
  notes?: string;
  note_photo_urls?: string[];
  creator_small_bags?: number;
  creator_medium_bags?: number;
  creator_large_bags?: number;
  currency?: string;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    name: string;
    rating: number;
    verified: boolean;
  };
}

const customColors = {
  brand: {
    primary: '#F5C542',
    secondary: '#1F2937',
  },
  background: {
    primary: '#FCFCFA',
    secondary: '#F3F2EE',
  },
  text: {
    primary: '#1B1D21',
    secondary: '#61646B',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  green: '#22C55E',
  greenLight: '#DCFCE7',
  red: '#EF4444',
  redLight: '#FEE2E2',
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
      return 'Available';
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
  const { requestRide, rides, allRides } = useRide();
  const { wallet, deductRequestFee } = usePayment();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [buttonScale] = useState(new Animated.Value(1));
  const [requesterBags, setRequesterBags] = useState({
    small: 0,
    medium: 0,
    large: 0,
  });

  useEffect(() => {
    setLoading(true);

    // Search in both own rides and all available rides
    if (id) {
      const foundRide = rides.find(r => r.id === id) || allRides.find(r => r.id === id);
      if (foundRide) {
        setRide(foundRide);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }, [id, rides, allRides]);

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const adjustBagCount = (size: 'small' | 'medium' | 'large', delta: number) => {
    setRequesterBags((prev) => ({
      ...prev,
      [size]: Math.max(0, prev[size] + delta),
    }));
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

    setSubmitting(true);
    animateButton(0.95);

    try {
      // Convert ride ID to valid UUID using utility function
      const mappedId = getValidRideId(ride.id);

      // Deduct the request fee
      const { error, success } = await deductRequestFee(mappedId);

      if (error || !success) {
        Alert.alert('Payment Failed', 'Failed to process request fee. Please try again.');
        return;
      }

      // Send ride request
      const { error: requestError } = await requestRide(mappedId, requesterBags);

      if (requestError) {
        Alert.alert('Request Failed', requestError.message || 'Failed to send ride request');
      } else {
        Alert.alert(
          'Request Sent!',
          'Your ride request has been sent successfully. You will be notified when the driver responds.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Request error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      animateButton(1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={customColors.brand.primary} />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="car-outline" size={64} color={customColors.gray[400]} />
          <Text style={styles.errorTitle}>Ride Not Found</Text>
          <Text style={styles.errorSubtitle}>This ride may no longer be available.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalFare = ride.fare ?? ride.estimated_fare;
  const seatCount = ride.available_seats && ride.available_seats > 0 ? ride.available_seats : 1;
  const perPersonFare = totalFare ? totalFare / seatCount : null;
  const bookingApp = ride.booking_app;
  const creatorSmallBags = ride.creator_small_bags ?? 0;
  const creatorMediumBags = ride.creator_medium_bags ?? 0;
  const creatorLargeBags = ride.creator_large_bags ?? 0;
  const creatorBagsTotal = creatorSmallBags + creatorMediumBags + creatorLargeBags;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={customColors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={customColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(ride.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
              {getStatusText(ride.status)}
            </Text>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>
              {ride.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'DR'}
            </Text>
            {ride.user?.verified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={8} color={customColors.background.primary} />
              </View>
            )}
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.user?.name || 'Unknown Driver'}</Text>
            <View style={styles.driverMeta}>
              <Ionicons name="star" size={14} color={customColors.brand.secondary} />
              <Text style={styles.ratingText}>{ride.user?.rating || '4.5'}</Text>
              {ride.user?.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={customColors.brand.primary} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeSection}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotStart]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeAddress}>{ride.pickup_address}</Text>
            </View>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotEnd]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>DROP-OFF</Text>
              <Text style={styles.routeAddress}>{ride.dropoff_address}</Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color={customColors.text.secondary} />
              <Text style={styles.detailText}>{ride.ride_date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={customColors.text.secondary} />
              <Text style={styles.detailText}>{ride.ride_time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name={getCabIcon(ride.cab_type || '')} size={20} color={customColors.text.secondary} />
              <Text style={styles.detailText}>{ride.cab_type ? ride.cab_type.charAt(0).toUpperCase() + ride.cab_type.slice(1) : 'Sedan'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={20} color={customColors.text.secondary} />
              <Text style={styles.detailText}>{ride.available_seats || 1} seats</Text>
            </View>
          </View>
          {bookingApp && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="phone-portrait-outline" size={20} color={customColors.text.secondary} />
                <Text style={styles.detailText}>Booked via {bookingApp}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.luggageSection}>
          <Text style={styles.luggageTitle}>Creator Luggage</Text>
          {creatorBagsTotal > 0 ? (
            <View style={styles.luggageRow}>
              <Text style={styles.luggageChip}>Small {creatorSmallBags}</Text>
              <Text style={styles.luggageChip}>Medium {creatorMediumBags}</Text>
              <Text style={styles.luggageChip}>Large {creatorLargeBags}</Text>
            </View>
          ) : (
            <Text style={styles.luggageEmpty}>No bags mentioned</Text>
          )}
        </View>

        {(ride.notes || (ride.note_photo_urls && ride.note_photo_urls.length > 0)) && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            {ride.notes ? <Text style={styles.notesText}>{ride.notes}</Text> : null}
            {ride.note_photo_urls && ride.note_photo_urls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notePhotoRow}>
                {ride.note_photo_urls.map((photoUrl) => (
                  <Image key={photoUrl} source={{ uri: photoUrl }} style={styles.notePhoto} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Fare Info */}
        {ride.fare && (
          <View style={styles.fareSection}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareAmount}>
              {ride.currency || '₹'}{ride.fare}
            </Text>
          </View>
        )}

        {perPersonFare && (
          <View style={styles.perPersonSection}>
            <Text style={styles.perPersonLabel}>Estimated Per Person</Text>
            <Text style={styles.perPersonAmount}>
              {ride.currency || '₹'}{perPersonFare.toFixed(0)}
            </Text>
            <Text style={styles.perPersonNote}>
              Based on {seatCount} seat{seatCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}

        <View style={styles.requesterBagsSection}>
          <Text style={styles.requesterBagsTitle}>Your Bags for This Request</Text>
          <View style={styles.requesterBagGrid}>
            {[
              { key: 'small', label: 'Small', icon: 'briefcase-outline' },
              { key: 'medium', label: 'Medium', icon: 'bag-handle-outline' },
              { key: 'large', label: 'Large', icon: 'cube-outline' },
            ].map((item) => (
              <View key={item.key} style={styles.requesterBagCard}>
                <Ionicons name={item.icon as any} size={16} color={customColors.text.secondary} />
                <Text style={styles.requesterBagLabel}>{item.label}</Text>
                <View style={styles.requesterBagCounter}>
                  <TouchableOpacity
                    style={styles.requesterBagBtn}
                    onPress={() => adjustBagCount(item.key as 'small' | 'medium' | 'large', -1)}
                  >
                    <Ionicons name="remove" size={14} color={customColors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.requesterBagValue}>
                    {requesterBags[item.key as 'small' | 'medium' | 'large']}
                  </Text>
                  <TouchableOpacity
                    style={styles.requesterBagBtn}
                    onPress={() => adjustBagCount(item.key as 'small' | 'medium' | 'large', 1)}
                  >
                    <Ionicons name="add" size={14} color={customColors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.requesterBagHint}>
            Creator will see this before accepting your request.
          </Text>
        </View>

        {/* Request Button */}
        <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonContainer]}>
          <TouchableOpacity
            style={[
              styles.requestButton,
              (ride.status !== 'pending' && ride.status !== 'active') && styles.disabledButton,
            ]}
            onPress={handleRequestRide}
            disabled={submitting || (ride.status !== 'pending' && ride.status !== 'active')}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={customColors.background.primary} />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color={customColors.background.primary}
                />
                <Text style={styles.requestButtonText}>
                  {ride.status === 'pending' || ride.status === 'active'
                    ? 'Request to Join (₹1)'
                    : 'Not Available'
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: customColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: customColors.gray[200],
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: customColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: customColors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: customColors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: customColors.background.primary,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: customColors.brand.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: customColors.background.secondary,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: customColors.text.primary,
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: customColors.text.secondary,
    marginLeft: 4,
    marginRight: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customColors.brand.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: customColors.brand.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  routeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 2,
  },
  routeDotStart: {
    backgroundColor: customColors.green,
  },
  routeDotEnd: {
    backgroundColor: customColors.red,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: customColors.text.secondary,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 16,
    color: customColors.text.primary,
    fontWeight: '500',
    lineHeight: 24,
  },
  routeConnector: {
    width: 2,
    height: 24,
    backgroundColor: customColors.gray[300],
    marginLeft: 8,
    marginVertical: 4,
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  'detailRow:last-child': {
    marginBottom: 0,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: customColors.text.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  fareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  fareLabel: {
    fontSize: 16,
    color: customColors.text.secondary,
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 24,
    color: customColors.text.primary,
    fontWeight: '700',
  },
  perPersonSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    marginTop: 12,
  },
  perPersonLabel: {
    fontSize: 14,
    color: customColors.text.secondary,
    fontWeight: '600',
  },
  perPersonAmount: {
    fontSize: 26,
    color: customColors.text.primary,
    fontWeight: '800',
    marginTop: 6,
  },
  perPersonNote: {
    fontSize: 12,
    color: customColors.text.secondary,
    marginTop: 4,
  },
  luggageSection: {
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  luggageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: customColors.text.primary,
    marginBottom: 8,
  },
  luggageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  luggageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: customColors.background.primary,
    borderWidth: 1,
    borderColor: customColors.gray[200],
    fontSize: 12,
    fontWeight: '600',
    color: customColors.text.primary,
  },
  luggageEmpty: {
    fontSize: 12,
    color: customColors.text.secondary,
  },
  notesSection: {
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: customColors.text.primary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
    color: customColors.text.secondary,
  },
  notePhotoRow: {
    gap: 10,
    marginTop: 10,
  },
  notePhoto: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: customColors.gray[200],
  },
  requesterBagsSection: {
    backgroundColor: customColors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  requesterBagsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: customColors.text.primary,
    marginBottom: 10,
  },
  requesterBagGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  requesterBagCard: {
    flex: 1,
    backgroundColor: customColors.background.primary,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customColors.gray[200],
  },
  requesterBagLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: customColors.text.secondary,
  },
  requesterBagCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  requesterBagBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: customColors.gray[100],
    borderWidth: 1,
    borderColor: customColors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  requesterBagValue: {
    minWidth: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: customColors.text.primary,
  },
  requesterBagHint: {
    marginTop: 10,
    fontSize: 12,
    color: customColors.text.secondary,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: customColors.brand.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  disabledButton: {
    backgroundColor: customColors.gray[300],
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: customColors.text.primary,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: customColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: customColors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: customColors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: customColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
