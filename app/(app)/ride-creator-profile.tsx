import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

// Mock ride data - in real app, this would come from your backend/API
const MOCK_RIDE_DATA = {
  id: 'ride123',
  pickup_address: 'MG Road, Bangalore',
  dropoff_address: 'Marathahalli, Bangalore',
  ride_date: '2026-02-10',
  ride_time: '02:00 PM',
  available_seats: 2,
  total_distance: '12.5 km',
  estimated_duration: '35 mins',
  vehicle_type: 'Sedan',
  status: 'accepted',
  created_at: new Date(Date.now() - 3600000).toISOString(),
  additional_notes: 'Will be leaving exactly on time. Please be at pickup point 5 mins early.',
};
const MOCK_USER_DATA = {
  id: 'user123',
  full_name: 'Sneha Reddy',
  email: 'sneha.reddy@example.com',
  phone: '+91 98765 43210',
  profile_image: null,
  bio: 'Regular commuter between MG Road and Marathahalli. Love to share rides and reduce traffic!',
  location: {
    area: 'Koramangala',
    city: 'Bangalore',
    coordinates: { lat: 12.9279, lng: 77.6271 }
  },
  ratings: {
    average: 4.8,
    total: 156,
    distribution: {
      5: 98,
      4: 42,
      3: 12,
      2: 3,
      1: 1
    }
  },
  verification: {
    email_verified: true,
    phone_verified: true,
    government_id: true,
    profile_complete: true
  },
  stats: {
    total_rides: 342,
    rides_as_driver: 189,
    rides_as_passenger: 153,
    member_since: '2023-06-15',
    response_rate: 96,
    on_time_rate: 94
  },
  preferences: {
    music: 'Allowed',
    smoking: 'Not Allowed',
    pets: 'Small Dogs Allowed',
    conversation: 'Friendly'
  }
};

export default function RideCreatorProfileScreen() {
  const router = useRouter();
  const { userId, rideId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [rideData, setRideData] = useState<any>(null);

  useEffect(() => {
    // Simulate API call to fetch user and ride data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In real app, you would fetch data based on userId and rideId
        // const userResponse = await fetch(`/api/users/${userId}`);
        // const rideResponse = await fetch(`/api/rides/${rideId}`);
        
        // Using mock data for now
        setTimeout(() => {
          setUserData(MOCK_USER_DATA);
          setRideData(MOCK_RIDE_DATA);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load profile');
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, rideId]);

  const handleCallUser = () => {
    Alert.alert('Call User', `Would you like to call ${userData?.phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log('Calling user...') }
    ]);
  };

  const handleMessageUser = () => {
    router.push(`/chat/${userData?.id}?userName=${userData?.full_name}`);
  };

  const handleReportUser = () => {
    Alert.alert('Report User', 'Why do you want to report this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => console.log('Reporting user...') }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.yellow} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={BRAND.gray} />
          <Text style={styles.errorText}>Profile not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride & Profile Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleReportUser}>
          <Ionicons name="flag-outline" size={24} color={BRAND.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userData.profile_image ? (
              <Image source={{ uri: userData.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(userData.full_name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.full_name}</Text>
            <View style={styles.verificationBadges}>
              {userData.verification.email_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="mail" size={16} color={BRAND.green} />
                  <Text style={styles.verifiedText}>Email</Text>
                </View>
              )}
              {userData.verification.phone_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="call" size={16} color={BRAND.green} />
                  <Text style={styles.verifiedText}>Phone</Text>
                </View>
              )}
              {userData.verification.government_id && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={BRAND.green} />
                  <Text style={styles.verifiedText}>ID</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={20} color={BRAND.yellow} />
              <Text style={styles.ratingValue}>{userData.ratings.average}</Text>
            </View>
            <Text style={styles.ratingCount}>({userData.ratings.total} reviews)</Text>
          </View>
        </View>

        {/* Ride Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>
          <View style={styles.rideInfoCard}>
            <View style={styles.rideRoute}>
              <View style={styles.routeMarkers}>
                <View style={[styles.routeDot, { backgroundColor: BRAND.green }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: BRAND.red }]} />
              </View>
              <View style={styles.routeText}>
                <Text style={styles.pickupText}>{rideData?.pickup_address}</Text>
                <Text style={styles.dropoffText}>{rideData?.dropoff_address}</Text>
              </View>
            </View>
            
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailRow}>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="calendar" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.ride_date}</Text>
                </View>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="time" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.ride_time}</Text>
                </View>
              </View>
              
              <View style={styles.rideDetailRow}>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="time" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.estimated_duration}</Text>
                </View>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="people" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.available_seats} seats</Text>
                </View>
              </View>
              
              <View style={styles.rideDetailRow}>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="speedometer" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.total_distance}</Text>
                </View>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="car" size={18} color={BRAND.gray} />
                  <Text style={styles.rideDetailText}>{rideData?.vehicle_type}</Text>
                </View>
              </View>
            </View>
            
            {rideData?.additional_notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes from driver:</Text>
                <Text style={styles.notesText}>{rideData.additional_notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{userData.bio}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCallUser}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={20} color={BRAND.black} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{userData.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BRAND.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleMessageUser}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail" size={20} color={BRAND.black} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{userData.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BRAND.gray} />
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Ionicons name="location" size={20} color={BRAND.black} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Location</Text>
              <Text style={styles.contactValue}>{userData.location.area}, {userData.location.city}</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.total_rides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.response_rate}%</Text>
              <Text style={styles.statLabel}>Response Rate</Text>
            </View>
          </View>
        </View>

        {/* Rating Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Distribution</Text>
          {Object.entries(userData.ratings.distribution).reverse().map(([stars, count]) => (
            <View key={stars} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{stars} ⭐</Text>
              <View style={styles.ratingBar}>
                <View 
                  style={[
                    styles.ratingBarFill, 
                    { width: `${(Number(count) / userData.ratings.total) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.ratingCountText}>{String(count)}</Text>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Preferences</Text>
          <View style={styles.preferencesGrid}>
            <View style={styles.preferenceItem}>
              <Ionicons name="musical-notes" size={18} color={BRAND.gray} />
              <Text style={styles.preferenceLabel}>Music</Text>
              <Text style={styles.preferenceValue}>{userData.preferences.music}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="flame" size={18} color={BRAND.gray} />
              <Text style={styles.preferenceLabel}>Smoking</Text>
              <Text style={styles.preferenceValue}>{userData.preferences.smoking}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="paw" size={18} color={BRAND.gray} />
              <Text style={styles.preferenceLabel}>Pets</Text>
              <Text style={styles.preferenceValue}>{userData.preferences.pets}</Text>
            </View>
            <View style={styles.preferenceItem}>
              <Ionicons name="chatbubbles" size={18} color={BRAND.gray} />
              <Text style={styles.preferenceLabel}>Chat</Text>
              <Text style={styles.preferenceValue}>{userData.preferences.conversation}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCallUser}>
            <Ionicons name="call" size={20} color={BRAND.black} />
            <Text style={styles.primaryButtonText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleMessageUser}>
            <Ionicons name="chatbubble" size={20} color={BRAND.black} />
            <Text style={styles.secondaryButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: BRAND.gray,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: BRAND.gray,
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'System',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 8,
    fontFamily: 'System',
  },
  verificationBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: BRAND.gray,
    marginLeft: 4,
    fontFamily: 'System',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: '600',
    color: BRAND.black,
    marginLeft: 4,
    fontFamily: 'System',
  },
  ratingCount: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 2,
    fontFamily: 'System',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 16,
    fontFamily: 'System',
  },
  bioText: {
    fontSize: 16,
    color: BRAND.gray,
    lineHeight: 24,
    fontFamily: 'System',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 2,
    fontFamily: 'System',
  },
  contactValue: {
    fontSize: 16,
    color: BRAND.black,
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 4,
    fontFamily: 'System',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    width: 40,
    fontSize: 14,
    color: BRAND.black,
    fontFamily: 'System',
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: BRAND.grayLight,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: BRAND.yellow,
    borderRadius: 4,
  },
  ratingCountText: {
    fontSize: 14,
    color: BRAND.gray,
    width: 30,
    textAlign: 'right',
    fontFamily: 'System',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  preferenceItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: BRAND.gray,
    marginLeft: 8,
    fontFamily: 'System',
  },
  preferenceValue: {
    fontSize: 14,
    color: BRAND.black,
    fontWeight: '500',
    marginLeft: 'auto',
    fontFamily: 'System',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.grayLight,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  backButton: {
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: BRAND.black,
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Ride Information Styles
  rideInfoCard: {
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    padding: 16,
  },
  rideRoute: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeMarkers: {
    alignItems: 'center',
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: BRAND.grayMedium,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pickupText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 16,
    fontFamily: 'System',
  },
  dropoffText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    fontFamily: 'System',
  },
  rideDetails: {
    gap: 12,
  },
  rideDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rideDetailText: {
    fontSize: 14,
    color: BRAND.black,
    fontFamily: 'System',
  },
  notesSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: BRAND.white,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
    fontFamily: 'System',
  },
  notesText: {
    fontSize: 14,
    color: BRAND.gray,
    lineHeight: 20,
    fontFamily: 'System',
  },
});
