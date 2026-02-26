import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ride } from '@/types';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import VerificationBadge from './VerificationBadge';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verification_status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  phone_number: string | null;
  created_at: string;
}

interface RideCardProps {
  ride: Ride;
  onPress?: () => void;
  onChat?: () => void;
  showChat?: boolean;
  isActive?: boolean;
  isCancelling?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({
  ride,
  onPress,
  onChat,
  showChat,
  isActive,
  isCancelling,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Fetch user profile when ride changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!ride.rider_id && !ride.driver_id) return;
      
      setLoadingUser(true);
      try {
        const userId = ride.driver_id || ride.rider_id;
        
        const { data: profile, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, verification_status, phone_number, created_at')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        } else if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [ride.rider_id, ride.driver_id]);

  // Get user display name with fallbacks
  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name;
    if (ride.user?.name) return ride.user.name;
    if (ride.driver_name) return ride.driver_name;
    return 'LinkCab User';
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (userProfile?.verification_status) return userProfile.verification_status;
    if (ride.user?.verified) return 'verified';
    return 'pending';
  };

  // Get user rating
  const getUserRating = () => {
    if (ride.user?.rating) return ride.user.rating.toString();
    return '4.5'; // Default rating
  };

  const available = ride.status === 'pending' || ride.status === 'active';
  const verificationStatus = getVerificationStatus();

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

  return (
    <TouchableOpacity style={styles.rideCard} onPress={onPress} activeOpacity={0.9} disabled={!onPress}>
      <View style={styles.cardTopRow}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.driverInitials}>{getInitials()}</Text>
            )}
            {verificationStatus === 'verified' && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={8} color={colors.background.primary} />
              </View>
            )}
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName} numberOfLines={1}>{getDisplayName()}</Text>
            <View style={styles.driverMeta}>
              <Ionicons name="star" size={11} color={'#F59E0B'} />
              <Text style={styles.ratingText}>{getUserRating()}</Text>
              <View style={styles.verificationBadge}>
                <VerificationBadge 
                  userId={userProfile?.id}
                  compact={true}
                />
              </View>
            </View>
            {userProfile?.phone_number && (
              <Text style={styles.memberSince}>
                Member since {new Date(userProfile.created_at).getFullYear()}
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
        {verificationStatus === 'verified' && (
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
            <Text style={styles.trustText}>Verified User</Text>
          </View>
        )}
        {userProfile && (
          <View style={styles.trustItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.trustText}>
              Active {Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
            </Text>
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
});
