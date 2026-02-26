import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  ScrollViewProps,
  Animated,
} from 'react-native';

// debug wrapper to find stray text nodes
const DebugScrollView: React.FC<ScrollViewProps> = props => {
  return (
    <ScrollView {...props}>
      {React.Children.map(props.children, child => {
        if (typeof child === 'string' || typeof child === 'number') {
          console.warn('DebugScrollView found raw string child:', child);
        }
        return child;
      })}
    </ScrollView>
  );
};
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from "../../contexts/AuthContext";
import { useRide } from "../../contexts/RideContext";
import { usePayment } from "../../contexts/PaymentContext";
import { colors } from "../../constants/theme";
import { getValidRideId } from "../../utils/rideIdUtils";
import { supabase } from "../../lib/supabase";

import { useSupabaseSubscription } from '@/hooks/useSupabaseSubscription';

import { Ride, RideRequest } from '@/types';

const customColors = {
  brand: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
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
  const { id, requestId, status, respondedAt } = useLocalSearchParams<{
  id?: string;
  requestId?: string;
  status?: string;
  respondedAt?: string;
}>();
  const { user } = useAuth();
  const { requestRide, rides, allRides, fetchRideRequests, respondToRideRequest } = useRide();
  const { wallet, deductRequestFee, refundRequestFee } = usePayment();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [buttonScale] = useState(new Animated.Value(1));
  const [userRequest, setUserRequest] = useState<{ status: string; responded_at?: string; created_at?: string } | null>(null);
  // only relevant when current user is owner of ride
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // helper to keep us safe from unexpected types slipping into state
  const safeRideRequests = Array.isArray(rideRequests) ? rideRequests : [];
  if (!Array.isArray(rideRequests)) {
    console.warn('rideRequests state has become non-array, sanitizing', rideRequests);
  }

  const checkUserRequest = async (rideId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('status, responded_at, created_at')
        .eq('ride_id', rideId)
        .eq('passenger_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking request:', error);
        return;
      }

      setUserRequest(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  useEffect(() => {
    setLoading(true);

    // Search in both own rides and all available rides
    if (id) {
      const foundRide = rides.find(r => r.id === id) || allRides.find(r => r.id === id);
      if (foundRide) {
        setRide(foundRide as Ride);
        
        // Check if user has already requested this ride
        if (user) {
          checkUserRequest(foundRide.id, user.id);
        }

        // if current user is the creator/owner, load incoming requests
        if (user && foundRide.rider_id === user.id) {
          loadIncomingRequests(foundRide.id);
        }
        
        // Also check if coming from My Requests with existing request data
        if (requestId && status && respondedAt) {
          setUserRequest({
            id: requestId,
            status: status,
            responded_at: respondedAt,
            created_at: respondedAt // Use responded_at as fallback for created_at
          });
        }
        
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }, [id, rides, allRides, user, requestId, status, respondedAt]);

  // realtime subscription to ride_request updates for this passenger
  useSupabaseSubscription(
    `ride_requests_passenger_${ride?.id}_${user?.id}`,
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'ride_requests',
      filter: ride && user ? `ride_id=eq.${ride.id},passenger_id=eq.${user.id}` : '1=0',
    },
    (payload: any) => {
      if (payload.new) {
        setUserRequest(payload.new);
      }
    }
  );

  // realtime subscription for owners to keep incoming list fresh
  useSupabaseSubscription(
    `ride_requests_owner_${ride?.id}`,
    {
      event: '*',
      schema: 'public',
      table: 'ride_requests',
      filter: ride ? `ride_id=eq.${ride.id}` : '1=0',
    },
    (payload: any) => {
      const newReq = payload.new as RideRequest;
      if (!newReq) return;
      setRideRequests(prev => {
        // ensure prev is an array, fall back to empty if corrupted
        const current: RideRequest[] = Array.isArray(prev) ? prev : [];
        const idx = current.findIndex(r => r.id === newReq.id);
        if (idx !== -1) {
          const copy = [...current];
          copy[idx] = newReq;
          return copy;
        }
        return [newReq, ...current];
      });
    }
  );

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const loadIncomingRequests = async (rideId: string) => {
    setRequestsLoading(true);
    try {
      const { error, data } = await fetchRideRequests(rideId);
      if (!error) {
        if (Array.isArray(data)) {
          setRideRequests(data as RideRequest[]);
        } else {
          console.warn('fetchRideRequests returned non-array, discarding', data);
          setRideRequests([]);
        }
      }
    } catch (e) {
      console.error('Error loading requests', e);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAcceptRequest = async (request: RideRequest) => {
    if (!ride) return;
    setRequestsLoading(true);
    try {
      const { error, success } = await respondToRideRequest(request.id, true);
      if (error || !success) {
        Alert.alert('Error', 'Could not accept request');
      } else {
        Alert.alert('Request accepted', 'You can now chat with the passenger.', [
          {
            text: 'Chat',
            onPress: () => {
              router.push({
                pathname: '/chat',
                params: { rideId: ride.id, otherUserId: request.passenger_id },
              });
            },
          },
          { text: 'OK' },
        ]);
        await loadIncomingRequests(ride.id);
      }
    } catch (e) {
      console.error('Accept error', e);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRejectRequest = async (request: RideRequest) => {
    if (!ride) return;
    setRequestsLoading(true);
    try {
      const { error, success } = await respondToRideRequest(request.id, false);
      if (error || !success) {
        Alert.alert('Error', 'Could not reject request');
      } else {
        Alert.alert('Request rejected', 'Passenger will be notified.');
        // passenger themselves should call refund when they sync; owner cannot refund
        await loadIncomingRequests(ride.id);
      }
    } catch (e) {
      console.error('Reject error', e);
    } finally {
      setRequestsLoading(false);
    }
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

      if (!mappedId) {
        Alert.alert('Error', 'Invalid ride ID');
        return;
      }

      // Deduct the request fee
      const { error, success } = await deductRequestFee(mappedId);
      if (error || !success) {
        console.error('deductRequestFee failed', { error, success, mappedId });
        const msg = error?.message || error?.toString?.() || 'Failed to process request fee';
        Alert.alert('Payment Failed', msg + '. Please try again.');
        return;
      }

      // Send ride request
      const { error: requestError } = await requestRide(mappedId);

      if (requestError) {
        Alert.alert('Request Failed', requestError.message || 'Failed to send ride request');
      } else {
        Alert.alert(
          'Request Sent!',
          'Your ride request has been sent successfully. You will be notified when the driver responds.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(app)/my-requests'),
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={customColors.background.primary} />

      {/* Header */}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={"#1A1A1A"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <DebugScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
        </View>

        {/* Fare Info */}
        {/* `ride.fare` can be 0; using `&&` would render the number 0 directly. */}
        {(ride.fare != null && ride.fare !== 0) && (
          <View style={styles.fareSection}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareAmount}>
              {ride.currency || '₹'}{ride.fare}
            </Text>
          </View>
        )}

        {/* Owner incoming requests */}
        {user && ride?.rider_id === user.id && (
          <View style={styles.ownerRequestsSection}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            {requestsLoading ? (
              <ActivityIndicator size="small" color={customColors.brand.primary} />
            ) : safeRideRequests.length === 0 ? (
              <Text style={styles.noRequestsText}>No one has requested to join yet.</Text>
            ) : (
              safeRideRequests.map(req => (
                <View key={req.id} style={styles.requestCardOwner}>
                  <View style={styles.requestRow}>
                    <Text style={styles.requestPassengerName}>{req.passenger?.full_name || 'Unknown User'}</Text>
                    <Text style={[styles.requestStatus, {color: getStatusColor(req.status)}]}>{req.status}</Text>
                  </View>
                  {req.status === 'pending' && (
                    <View style={styles.requestActionsRow}>
                      <TouchableOpacity
                        style={[styles.ownerActionBtn, styles.acceptBtn]}
                        onPress={() => handleAcceptRequest(req)}
                      >
                        <Text style={styles.ownerActionText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.ownerActionBtn, styles.rejectBtn]}
                        onPress={() => handleRejectRequest(req)}
                      >
                        <Text style={styles.ownerActionText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Request Button - only show for non-owners (passengers) */}
        {user?.id !== ride?.rider_id && (
          <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonContainer]}>
            <TouchableOpacity
              style={[
                styles.requestButton,
                (ride.status !== 'pending' && ride.status !== 'active') && styles.disabledButton,
                userRequest && styles.disabledButton,
              ]}
              onPress={handleRequestRide}
              disabled={submitting || (ride.status !== 'pending' && ride.status !== 'active') || !!userRequest}
              activeOpacity={0.8}
            >
              <Ionicons
                name={userRequest ? (userRequest.status === 'accepted' ? 'checkmark-circle' : userRequest.status === 'rejected' ? 'close-circle' : 'time-outline') : 'paper-plane-outline'}
                size={20}
                color={customColors.background.primary}
              />
              <Text style={styles.requestButtonText}>
                {userRequest ? (
                  userRequest.status === 'accepted' ? 'Request Accepted' :
                  userRequest.status === 'rejected' ? 'Request Rejected' :
                  'Request Pending'
                ) : (
                  ride.status === 'pending' || ride.status === 'active'
                    ? 'Request to Join (₹1)'
                    : 'Not Available'
                )}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Request Timestamp */}
        {userRequest && (
          <View style={styles.requestTimestampContainer}>
            <Ionicons name="time-outline" size={14} color={customColors.gray[500]} />
            <Text style={styles.requestTimestampText}>
              Requested {userRequest.created_at ? new Date(userRequest.created_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'recently'}
            </Text>
          </View>
        )}

        {/* Chat button for accepted passenger */}
        {userRequest?.status === 'accepted' && user?.id !== ride?.rider_id && (
          <View style={styles.chatActionContainer}>
            <TouchableOpacity
              style={styles.chatNowButton}
              onPress={() => {
                if (ride) {
                  router.push({
                    pathname: '/chat',
                    params: { rideId: ride.id, otherUserId: ride.rider_id },
                  });
                }
              }}
            >
              <Text style={styles.chatNowText}>Chat with Driver</Text>
            </TouchableOpacity>
          </View>
        )}
      </DebugScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: customColors.background.primary,
    marginTop: 40,
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
    fontSize: 18,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "#FAFAFA",
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFD700",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: "#1A1A1A",
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#FAFAFA",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: "#1A1A1A",
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
    marginRight: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: '600',
    marginLeft: 4,
  },
  routeSection: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingBottom: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 4,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  routeDotStart: {
    backgroundColor: "#22C55E",
  },
  routeDotEnd: {
    backgroundColor: "#EF4444",
  },
  routeContent: {
    flex: 1,
    paddingBottom: 20,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: "#9CA3AF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: '600',
    lineHeight: 22,
  },
  routeConnector: {
    position: 'absolute',
    left: 31,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: "#E5E7EB",
    zIndex: -1,
  },
  detailsSection: {
    padding: 20,
    backgroundColor: "#FAFAFA",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // Note: 'detailRow:last-child' is not valid React Native style, removed
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
    fontWeight: '500',
  },
  fareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "#FFFBEB", // Light yellow bg
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  // owner request section styles
  ownerRequestsSection: {
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  noRequestsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 12,
  },
  requestCardOwner: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestPassengerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  requestStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  requestActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  ownerActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  ownerActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatActionContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  chatNowButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  chatNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fareLabel: {
    fontSize: 16,
    color: "#92400E",
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 24,
    color: "#1A1A1A",
    fontWeight: '800',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 34,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#FFD700",
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: "#1A1A1A",
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  backButtonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: '700',
  },
  requestTimestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  requestTimestampText: {
    fontSize: 13,
    color: customColors.gray[500],
    marginLeft: 6,
    fontWeight: '500',
  },
});