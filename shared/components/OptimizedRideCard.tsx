import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ride } from '@/types';
import { colors } from '@/constants/theme';
import VerificationBadge from './VerificationBadge';
import { 
  useUserProfile, 
  getDisplayName, 
  getUserInitials, 
  isUserVerified,
  getMemberSinceText,
  getActivityText
} from '@/hooks/useUserProfile';

interface OptimizedRideCardProps {
  ride: Ride;
  onPress?: () => void;
  onChat?: () => void;
  showChat?: boolean;
  isActive?: boolean;
  isCancelling?: boolean;
}

export const OptimizedRideCard: React.FC<OptimizedRideCardProps> = ({
  ride,
  onPress,
  onChat,
  showChat,
  isActive,
  isCancelling,
}) => {
  // Get user ID from ride (driver_id first, then rider_id)
  const userId = ride.driver_id || ride.rider_id;
  const { profile, loading, error } = useUserProfile(userId);

  const available = ride.status === 'pending' || ride.status === 'active';
  const isVerified = isUserVerified(profile);

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

  if (error) {
    console.error('Error loading user profile:', error);
  }

  return (
    <TouchableOpacity style={styles.rideCard} onPress={onPress} activeOpacity={0.9} disabled={!onPress}>
      <View style={styles.cardTopRow}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.driverInitials}>{getUserInitials(profile, ride.user?.name)}</Text>
            )}
            {isVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={8} color={colors.background.primary} />
              </View>
            )}
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName} numberOfLines={1}>
              {getDisplayName(profile, ride.user?.name || ride.driver_name)}
            </Text>
            <View style={styles.driverMeta}>
              <Ionicons name="star" size={11} color={'#F59E0B'} />
              <Text style={styles.ratingText}>{ride.user?.rating || '4.5'}</Text>
              <View style={styles.verificationBadge}>
                <VerificationBadge 
                  userId={userId}
                  compact={true}
                />
              </View>
            </View>
            {profile && (
              <Text style={styles.memberSince}>
                {getMemberSinceText(profile)}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.statusPill, available ? styles.statusPillAvailable : styles.statusPillBooked]}>
          <View style={[styles.statusDot, available ? styles.dotAvailable : styles.dotBooked]} />
          <Text style={[styles.statusPillText, available ? styles.statusPillTextAvailable : styles.statusPillTextBooked]}> 
            {available ? 'Available' : 'Booked'}
          </Text>
        </View>
      </View>

      <View style={styles.routeTimeline}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineMarker}><View style={styles.timelineDotGreen} /></View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>PICKUP</Text>
            <Text style={styles.timelineAddress} numberOfLines={1}>{ride.pickup_address}</Text>
          </View>
        </View>
        <View style={styles.timelineConnector}><View style={styles.dashedLine} /></View>
        <View style={styles.timelineRow}>
          <View style={styles.timelineMarker}><View style={styles.timelineDotRed} /></View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>DROP-OFF</Text>
            <Text style={styles.timelineAddress} numberOfLines={1}>{ride.dropoff_address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoChipsRow}>
        <View style={styles.infoChip}>
          <Ionicons name="calendar-outline" size={13} color={colors.text.primary} />
          <Text style={styles.infoChipText}>{ride.ride_date || 'Today'}</Text>
        </View>
        <View style={styles.infoChip}>
          <Ionicons name="time-outline" size={13} color={colors.text.primary} />
          <Text style={styles.infoChipText}>{ride.ride_time || 'Now'}</Text>
        </View>
        <View style={styles.infoChip}>
          <Ionicons name="car-sport-outline" size={13} color={colors.text.primary} />
          <Text style={styles.infoChipText}>{ride.cab_type ? ride.cab_type.charAt(0).toUpperCase() + ride.cab_type.slice(1) : 'Sedan'}</Text>
        </View>
        <View style={styles.infoChip}>
          <Ionicons name="people-outline" size={13} color={colors.text.primary} />
          <Text style={styles.infoChipText}>{ride.available_seats ? `${ride.available_seats} seats` : '1 seat'}</Text>
        </View>
      </View>

      {/* Trust Indicators */}
      <View style={styles.trustIndicators}>
        {isVerified && (
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
            <Text style={styles.trustText}>Verified User</Text>
          </View>
        )}
        {profile && (
          <View style={styles.trustItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.trustText}>{getActivityText(profile)}</Text>
          </View>
        )}
      </View>

      {showChat && onChat && (
        <View style={styles.chatBtnWrapper}>
          <TouchableOpacity style={styles.chatBtn} onPress={onChat} disabled={isCancelling}>
            {isCancelling ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.background.primary} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Reuse the same styles from RideCard
const styles = StyleSheet.create({
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  driverInitials: {
    color: colors.background.primary,
    fontWeight: '700',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#22C55E',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: 120,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
  },
  verificationBadge: {
    marginLeft: 8,
  },
  memberSince: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillAvailable: {
    backgroundColor: '#DCFCE7',
  },
  statusPillBooked: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  dotAvailable: { backgroundColor: '#22C55E' },
  dotBooked: { backgroundColor: '#EF4444' },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPillTextAvailable: { color: '#16A34A' },
  statusPillTextBooked: { color: '#991B1B' },
  routeTimeline: {
    marginTop: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineMarker: {
    width: 24,
    alignItems: 'center',
  },
  timelineDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  timelineDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  timelineAddress: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  timelineConnector: {
    position: 'absolute',
    left: 12,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  dashedLine: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  infoChipText: {
    marginLeft: 4,
    fontSize: 12,
  },
  trustIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  chatBtnWrapper: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
