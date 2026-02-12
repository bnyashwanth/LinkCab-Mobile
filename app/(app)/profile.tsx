import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');

// Brand Colors
const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF3CD',
  yellowDark: '#E6C200',
  black: '#1A1A1A',
  blackLight: '#333333',
  white: '#FFFFFF',
  gray: '#6B7280',
  grayLight: '#F5F5F5',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { rides } = useRide();
  const [uploading, setUploading] = useState(false);

  const completedRides = rides.filter((r: any) => r.status === 'completed').length;
  const totalRides = rides.length;
  const rating = 4.8;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        'Change Profile Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: pickFromCamera },
          { text: 'Choose from Gallery', onPress: pickFromGallery },
        ]
      );
    } catch (error) {
      console.error('Error showing image picker options:', error);
    }
  };

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string, base64: string) => {
    try {
      setUploading(true);

      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const accountMenuItems = [
    { icon: 'person-outline', label: 'Edit Profile', subtitle: 'Update your info', route: '/(app)/edit-profile' },
    { icon: 'car-outline', label: 'My Rides', subtitle: `${totalRides} rides`, route: '/my-rides' },
    { icon: 'shield-checkmark-outline', label: 'Verification', subtitle: 'Complete verification', route: '/(app)/verification' },
    { icon: 'wallet-outline', label: 'Wallet', subtitle: 'Manage balance', route: '/(app)/wallet' },
    { icon: 'card-outline', label: 'Payment Methods', subtitle: 'Manage cards', route: '/(app)/payment-methods' },
    { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Ride requests', route: '/(app)/requests' },
  ];

  const supportMenuItems = [
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', subtitle: 'Account settings', route: '/(app)/privacy-security' },
    { icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'Get assistance', route: '/(app)/help-support' },
    { icon: 'document-text-outline', label: 'Terms & Conditions', subtitle: 'Legal info', route: '/(app)/terms' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Compact Header */}
      <View style={styles.compactHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(app)/privacy-security')}>
          <Ionicons name="settings-outline" size={24} color={BRAND.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Info - Now Scrollable */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={BRAND.yellow} size="small" />
                </View>
              )}
            </View>
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={14} color={BRAND.black} />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {profile?.phone && (
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={14} color={BRAND.yellow} />
              <Text style={styles.userPhone}>{profile.phone}</Text>
            </View>
          )}

          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={BRAND.black} />
            <Text style={styles.verifiedText}>Verified Account</Text>
          </View>
        </View>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="car" size={22} color={BRAND.black} />
            </View>
            <Text style={styles.statValue}>{totalRides}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-done" size={22} color={BRAND.black} />
            </View>
            <Text style={styles.statValue}>{completedRides}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={22} color={BRAND.black} />
            </View>
            <Text style={styles.statValue}>{rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(app)/create-ride')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionPrimary}>
              <View style={styles.quickActionIconBlack}>
                <Ionicons name="add-circle" size={24} color={BRAND.yellow} />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitleLight}>Create Ride</Text>
                <Text style={styles.quickActionSubtitleLight}>Share your journey</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.yellow} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(app)/my-rides')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionSecondary}>
              <View style={styles.quickActionIconYellow}>
                <Ionicons name="time" size={24} color={BRAND.black} />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitleDark}>Ride History</Text>
                <Text style={styles.quickActionSubtitleDark}>View past rides</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {accountMenuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index === accountMenuItems.length - 1 && styles.menuItemLast
                ]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={BRAND.black} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={BRAND.gray} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            {supportMenuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index === supportMenuItems.length - 1 && styles.menuItemLast
                ]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={BRAND.black} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={BRAND.gray} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>LinkCab v1.0.0</Text>

        <View style={{ height: 40 }} />
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
    backgroundColor: BRAND.white,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: BRAND.yellow,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.yellow,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: BRAND.black,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BRAND.yellow,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  userPhone: {
    fontSize: 14,
    color: BRAND.black,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: BRAND.gray,
    fontWeight: '500',
  },
  quickActionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND.black,
    borderRadius: 16,
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND.white,
    borderWidth: 2,
    borderColor: BRAND.yellow,
    borderRadius: 16,
  },
  quickActionIconBlack: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickActionIconYellow: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitleLight: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    marginBottom: 2,
  },
  quickActionSubtitleLight: {
    fontSize: 13,
    color: BRAND.yellow,
  },
  quickActionTitleDark: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  quickActionSubtitleDark: {
    fontSize: 13,
    color: BRAND.gray,
  },
  menuSection: {
    marginBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: BRAND.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: BRAND.gray,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: BRAND.gray,
    marginTop: 20,
  },
});
