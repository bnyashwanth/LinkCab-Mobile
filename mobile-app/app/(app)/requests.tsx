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
import * as api from "../../lib/api";
import { supabase } from "../../lib/supabase";

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

export default function RequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refundRequestFee } = usePayment();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch ride requests for rides created by current user
  const fetchRideRequests = async () => {
    if (!user) {
      setRideRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.fetchRideRequestsForMyRides(user.id);
      if (error) {
        console.error('Error fetching ride requests:', error);
        setRideRequests([]);
      } else {
        setRideRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      setRideRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideRequests();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideRequests();
    setRefreshing(false);
  };

  const filteredRequests = rideRequests.filter((request: any) => {
    if (activeTab === 'pending') return request.status === 'pending';
    if (activeTab === 'accepted') return ['accepted', 'in_progress'].includes(request.status);
    if (activeTab === 'rejected') return request.status === 'cancelled';
    return false;
  });

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      Alert.alert('Success', 'Ride request accepted!');
      await fetchRideRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept ride request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this ride request?\n\nThe ₹1 request fee will be refunded to the requester.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject & Refund',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              const { error } = await supabase
                .from('ride_requests')
                .update({ status: 'cancelled', responded_at: new Date().toISOString() })
                .eq('id', requestId);

              if (error) throw error;

              // Get the ride_id to refund
              const request = rideRequests.find(r => r.id === requestId);
              if (request?.ride_id) {
                const { error: refundError } = await refundRequestFee(request.ride_id);
                if (refundError) {
                  console.warn('Refund failed:', refundError);
                  Alert.alert('Request Rejected', 'Ride request rejected. Refund processing may take a few moments.');
                } else {
                  Alert.alert('Request Rejected', 'Ride request rejected and ₹1 fee refunded to requester.');
                }
              }

              await fetchRideRequests();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject ride request');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: BRAND.yellowLight, color: BRAND.black, icon: 'time-outline', label: 'Pending' };
      case 'accepted':
      case 'in_progress':
        return { bg: '#DCFCE7', color: '#166534', icon: 'checkmark-circle-outline', label: 'Accepted' };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#991B1B', icon: 'close-circle-outline', label: 'Rejected' };
      default:
        return { bg: BRAND.grayLight, color: BRAND.gray, icon: 'help-outline', label: status };
    }
  };

  const renderRequestCard = (request: any) => {
    const statusConfig = getStatusConfig(request.status);
    const isProcessing = processingId === request.id;

    return (
      <View key={request.id} style={styles.requestCard}>
        {/* Card Header */}
        <View style={styles.requestHeader}>
          <View style={styles.requesterInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(request.passenger?.full_name || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.requesterDetails}>
              <Text style={styles.requesterName}>
                {request.passenger?.full_name || 'Unknown User'}
              </Text>
              <Text style={styles.requestTime}>
                {new Date(request.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Route Section */}
        <View style={styles.rideDetails}>
          <View style={styles.routeContainer}>
            <View style={styles.routeMarkers}>
              <View style={[styles.routeDot, { backgroundColor: BRAND.green }]} />
              <View style={styles.routeLine} />
              <View style={[styles.routeDot, { backgroundColor: BRAND.red }]} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.locationText} numberOfLines={1}>
                {request.ride?.pickup_address || 'Pickup Location'}
              </Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {request.ride?.dropoff_address || 'Dropoff Location'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ride Info */}
        <View style={styles.requestInfo}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="people-outline" size={18} color={BRAND.black} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Seats</Text>
              <Text style={styles.infoValue}>{request.ride?.available_seats ?? 1}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {request.status === 'pending' && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectRequest(request.id)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={20} color={BRAND.red} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(request.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={BRAND.black} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={BRAND.black} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(request.status === 'accepted' || request.status === 'in_progress') && (
          <View style={styles.acceptedInfo}>
            <View style={styles.acceptedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={BRAND.green} />
              <Text style={styles.acceptedText}>You accepted this ride</Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => {
                const userId = request.passenger?.id || request.ride?.rider_id;
                const rideId = request.ride_id;
                if (!userId || !rideId) {
                  Alert.alert('Details Unavailable', 'Unable to open details for this request.');
                  return;
                }
                router.push(`/(app)/ride-creator-profile?userId=${userId}&rideId=${rideId}`);
              }}
            >
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color={BRAND.black} />
            </TouchableOpacity>
          </View>
        )}

        {request.ride?.status === 'in_progress' && (
          <View style={styles.inProgressInfo}>
            <Ionicons name="car-outline" size={18} color={BRAND.green} />
            <Text style={styles.inProgressText}>Trip in Progress</Text>
            <TouchableOpacity
              style={styles.completeTripBtn}
              onPress={() => router.push(`/(app)/rate-user?otherUserId=${request.passenger?.id || 'default'}&rideId=${request.ride_id}`)}
            >
              <Ionicons name="star" size={16} color={BRAND.white} />
              <Text style={styles.completeTripBtnText}>Complete & Rate</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'cancelled' && (
          <View style={styles.rejectedInfo}>
            <Ionicons name="close-circle" size={18} color={BRAND.red} />
            <Text style={styles.rejectedText}>You rejected this ride</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Ride Requests</Text>
          <Text style={styles.subtitle}>Accept or reject ride requests</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending', icon: 'time-outline' },
          { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
          { key: 'rejected', label: 'Rejected', icon: 'close-circle-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? BRAND.black : BRAND.gray}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.key === 'pending' && filteredRequests.length > 0 && activeTab !== 'pending' && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{filteredRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND.yellow]}
            tintColor={BRAND.yellow}
          />
        }
      >
        {loading && rideRequests.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator size="large" color={BRAND.yellow} />
            </View>
            <Text style={styles.stateText}>Loading requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  activeTab === 'pending' ? 'notifications-outline' :
                    activeTab === 'accepted' ? 'checkmark-done-outline' :
                      'close-circle-outline'
                }
                size={48}
                color={BRAND.gray}
              />
            </View>
            <Text style={styles.stateText}>
              No {activeTab} requests
            </Text>
            <Text style={styles.stateSubtext}>
              {activeTab === 'pending' && 'New ride requests will appear here'}
              {activeTab === 'accepted' && 'Rides you accept will appear here'}
              {activeTab === 'rejected' && 'Rejected rides will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map(renderRequestCard)}
          </View>
        )}

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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND.gray,
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: BRAND.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BRAND.grayLight,
    gap: 6,
  },
  activeTab: {
    backgroundColor: BRAND.yellow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.gray,
  },
  activeTabText: {
    color: BRAND.black,
  },
  tabBadge: {
    backgroundColor: BRAND.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.white,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // States
  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateText: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    marginTop: 4,
  },

  // Request Cards
  requestsList: {
    gap: 14,
  },
  requestCard: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: BRAND.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Route
  rideDetails: {
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeMarkers: {
    alignItems: 'center',
    marginRight: 14,
    paddingVertical: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: BRAND.grayMedium,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
  },

  // Info
  requestInfo: {
    flexDirection: 'row',
    backgroundColor: BRAND.grayLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: BRAND.gray,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
  },
  infoDivider: {
    width: 1,
    height: '100%',
    backgroundColor: BRAND.grayMedium,
    marginHorizontal: 8,
  },

  // Actions
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    borderWidth: 2,
    borderColor: BRAND.red,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.red,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND.yellow,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Accepted State
  acceptedInfo: {
    alignItems: 'center',
    gap: 12,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.green,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    width: '100%',
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Rejected State
  rejectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  rejectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.red,
  },
  inProgressInfo: {
    alignItems: 'center',
    gap: 12,
  },
  inProgressText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.green,
  },
  completeTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeTripBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
});
