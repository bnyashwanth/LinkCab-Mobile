import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from "../../contexts/AuthContext";
import { usePayment } from "../../contexts/PaymentContext";
import { supabase } from "../../lib/supabase";
import { useSupabaseSubscription } from '@/hooks/useSupabaseSubscription';
import * as Sentry from '@sentry/react-native';

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

// Custom colors
const colors = {
  primary: {
    50: '#FFF8DC',
    100: '#FFE4B5',
    500: BRAND.yellow,
    600: BRAND.yellowDark,
  },
  secondary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
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
  white: BRAND.white,
  text: {
    primary: BRAND.black,
    secondary: BRAND.gray,
    tertiary: BRAND.grayLight,
  },
  background: {
    primary: BRAND.white,
    secondary: BRAND.grayLight,
  },
};

interface RideRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requested_at: string;
  responded_at?: string;
  created_at: string;
  ride?: {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    ride_date: string;
    ride_time: string;
    available_seats: number;
    cab_type: string;
    fare: number;
    currency: string;
    rider_id: string;
    driver_id?: string;
    status: string;
    created_at: string;
  };
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refundRequestFee } = usePayment();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRequests, setUserRequests] = useState<RideRequest[]>([]);
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());

  // Fetch user's ride requests
  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  // hook is exported as default for safer import resolution
  useSupabaseSubscription(
    `my_requests_${user?.id}`,
    {
      event: '*',
      schema: 'public',
      table: 'ride_requests',
      filter: user ? `passenger_id=eq.${user.id}` : '1=0',
    },
    () => {
      fetchUserRequests();
    }
  );

  const fetchUserRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch ride requests with ride details
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          ride:rides(
            id,
            pickup_address,
            dropoff_address,
            ride_date,
            ride_time,
            available_seats,
            cab_type,
            fare,
            currency,
            rider_id,
            driver_id,
            status,
            created_at
          )
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        console.error('Error fetching requests:', error);
        return;
      }

      setUserRequests(data || []);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserRequests();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // whenever requests change look for rejected rides to refund the fee
  useEffect(() => {
    userRequests.forEach(async (req) => {
      if (req.status === 'rejected' && !refundedIds.has(req.id)) {
        const { error, success } = await refundRequestFee(req.ride_id);
        if (success) {
          setRefundedIds(prev => new Set(prev).add(req.id));
        } else {
          console.error('Refund failed for request', req.id, error);
        }
      }
    });
  }, [userRequests, refundedIds, refundRequestFee]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return colors.success[500];
      case 'rejected':
        return colors.danger[500];
      case 'cancelled':
        return colors.gray[500];
      case 'pending':
        return colors.warning[500];
      default:
        return colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const handleRequestPress = (request: RideRequest) => {
    if (request.ride) {
      router.push(`/(app)/[book-ride]?id=${request.ride_id}&requestId=${request.id}&status=${request.status}&respondedAt=${request.responded_at}`);
    }
  };

  const renderRequest = ({ item }: { item: RideRequest }) => {
    if (!item.ride) return null;

    const isPending = item.status === 'pending';
    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isCancelled = item.status === 'cancelled';

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => handleRequestPress(item)}
        activeOpacity={0.92}
      >
        {/* Header with Status */}
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={styles.cardTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          Request to {item.ride.dropoff_address.split(',')[0]}
        </Text>
        <Text style={styles.cardSubtitle}>
          From {item.ride.pickup_address.split(',')[0]}
        </Text>

        {/* Route Info */}
        <View style={styles.routeSection}>
          <View style={styles.routePoint}>
            <View style={[styles.pointIcon, { backgroundColor: colors.success[500] }]}>
              <Ionicons name="location" size={12} color="white" />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {item.ride.pickup_address}
              </Text>
            </View>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routePoint}>
            <View style={[styles.pointIcon, { backgroundColor: colors.danger[500] }]}>
              <Ionicons name="flag" size={12} color="white" />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {item.ride.dropoff_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.detailText}>{item.ride.ride_date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.detailText}>{item.ride.ride_time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="car-outline" size={14} color={colors.gray[500]} />
            <Text style={styles.detailText}>{item.ride.cab_type}</Text>
          </View>
        </View>

        {/* Fare and Seats */}
        <View style={styles.fareSection}>
          <View style={styles.fareItem}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareAmount}>{item.ride.currency}{item.ride.fare}</Text>
          </View>
          <View style={styles.fareItem}>
            <Text style={styles.fareLabel}>Seats</Text>
            <Text style={styles.fareAmount}>{item.ride.available_seats}</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isAccepted && styles.actionButtonSuccess,
              isRejected && styles.actionButtonDanger,
              isCancelled && styles.actionButtonDisabled,
            ]}
            onPress={() => handleRequestPress(item)}
            disabled={!isPending}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.actionButtonText,
              isAccepted && styles.actionButtonTextSuccess,
              isRejected && styles.actionButtonTextDanger,
              isCancelled && styles.actionButtonTextDisabled,
            ]}>
              {isPending ? 'View Details' : 
               isAccepted ? 'View Ride' : 
               isRejected ? 'Request Rejected' : 
               'Request Cancelled'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Response Time */}
        {item.responded_at && (
          <View style={styles.responseTime}>
            <Text style={styles.responseTimeText}>
              {isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Cancelled'} on{' '}
              {new Date(item.responded_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && userRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Requests</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="paper-plane-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't sent any ride requests yet
            </Text>
            <TouchableOpacity
              style={styles.createRequestBtn}
              onPress={() => router.push('/(app)/discover')}
            >
              <Text style={styles.createRequestBtnText}>Find Rides</Text>
            </TouchableOpacity>
          </View>
        ) : (
          userRequests.map((request) => (
            <View key={request.id}>
              {renderRequest({ item: request })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    marginTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cardTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  routeSection: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[300],
    marginLeft: 10,
    marginBottom: 8,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  fareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  fareItem: {
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardActions: {
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonSuccess: {
    backgroundColor: colors.success[500],
  },
  actionButtonDanger: {
    backgroundColor: colors.danger[500],
  },
  actionButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionButtonTextSuccess: {
    color: colors.white,
  },
  actionButtonTextDanger: {
    color: colors.white,
  },
  actionButtonTextDisabled: {
    color: colors.gray[500],
  },
  responseTime: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  responseTimeText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createRequestBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createRequestBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
