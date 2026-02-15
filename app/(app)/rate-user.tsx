import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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

interface RatingData {
  communication: number;
  punctuality: number;
  safety: number;
  overall: number;
  comment: string;
}

export default function RateUserScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const otherUserId = params.otherUserId as string;
  const rideId = params.rideId as string;
  
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<RatingData>({
    communication: 0,
    punctuality: 0,
    safety: 0,
    overall: 0,
    comment: '',
  });

  useEffect(() => {
    if (!user || !otherUserId || !rideId) {
      if (router.canGoBack?.()) {
        router.back();
      } else {
        router.replace('/(app)/home');
      }
      return;
    }

    fetchOtherUser();
  }, [user, otherUserId, rideId]);

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (error) {
        console.error('Error fetching other user:', error);
        return;
      }

      setOtherUser(data);
    } catch (error) {
      console.error('Exception fetching other user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category: keyof RatingData, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value,
      overall: calculateOverall({ ...prev, [category]: value }),
    }));
  };

  const calculateOverall = (data: RatingData): number => {
    const { communication, punctuality, safety } = data;
    return Math.round((communication + punctuality + safety) / 3);
  };

  const handleSubmitRating = async () => {
    if (ratings.overall === 0) {
      Alert.alert('Rating Required', 'Please provide ratings before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // Submit rating to database
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          rater_id: user!.id,
          rated_user_id: otherUserId,
          ride_id: rideId,
          communication_rating: ratings.communication,
          punctuality_rating: ratings.punctuality,
          safety_rating: ratings.safety,
          overall_rating: ratings.overall,
          comment: ratings.comment.trim(),
        });

      if (error) {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
        return;
      }

      // Update user's average rating
      await updateUserRating();

      Alert.alert(
        'Rating Submitted! ⭐',
        'Thank you for providing feedback. This helps build trust in our community.',
        [
          {
            text: 'Done',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateUserRating = async () => {
    try {
      // Get all ratings for the user
      const { data: existingRatings } = await supabase
        .from('user_ratings')
        .select('overall_rating')
        .eq('rated_user_id', otherUserId);

      if (!existingRatings || existingRatings.length === 0) return;

      // Calculate new average
      const totalRating = existingRatings.reduce((sum, rating) => sum + rating.overall_rating, 0);
      const averageRating = totalRating / existingRatings.length;

      // Update user's profile with new average
      await supabase
        .from('profiles')
        .update({
          rating: averageRating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', otherUserId);
    } catch (error) {
      console.error('Error updating user rating:', error);
    }
  };

  const renderStarRating = (category: keyof RatingData, label: string) => (
    <View style={styles.ratingCategory}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={styles.starButton}
            onPress={() => handleRatingChange(category, star)}
          >
            <Ionicons
              name={Number(ratings[category]) >= star ? 'star' : 'star-outline'}
              size={24}
              color={Number(ratings[category]) >= star ? BRAND.yellow : BRAND.grayMedium}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingValue}>{ratings[category]}.0</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.yellow} />
          <Text style={styles.loadingText}>Loading user info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* User Info */}
        {otherUser && (
          <View style={styles.userInfoCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {otherUser.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{otherUser.full_name}</Text>
              <View style={styles.verificationBadge}>
                <Ionicons
                  name={otherUser.verification_status === 'verified' ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={otherUser.verification_status === 'verified' ? BRAND.green : BRAND.gray}
                />
                <Text style={styles.verificationText}>
                  {otherUser.verification_status === 'verified' ? 'Verified User' : 'Unverified'}
                </Text>
              </View>
              <Text style={styles.userEmail}>{otherUser.email}</Text>
              {otherUser.phone && (
                <Text style={styles.userPhone}>{otherUser.phone}</Text>
              )}
            </View>
          </View>
        )}

        {/* Rating Form */}
        <View style={styles.ratingForm}>
          <Text style={styles.formTitle}>How was your experience?</Text>
          
          {renderStarRating('communication', 'Communication')}
          {renderStarRating('punctuality', 'Punctuality')}
          {renderStarRating('safety', 'Safety')}
          
          <View style={styles.overallRating}>
            <Text style={styles.overallLabel}>Overall Rating</Text>
            <View style={styles.overallStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= ratings.overall ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= ratings.overall ? BRAND.yellow : BRAND.grayMedium}
                />
              ))}
            </View>
            <Text style={styles.overallValue}>{ratings.overall}.0</Text>
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={ratings.comment}
              onChangeText={(text) => setRatings(prev => ({ ...prev, comment: text }))}
              placeholder="Share details about your experience..."
              placeholderTextColor={BRAND.gray}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitRating}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={BRAND.white} />
            ) : (
              <>
                <Ionicons name="star" size={20} color={BRAND.white} />
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.grayLight,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  userInfoCard: {
    backgroundColor: BRAND.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
  },
  userDetails: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    color: BRAND.gray,
  },
  userEmail: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: BRAND.gray,
  },
  ratingForm: {
    flex: 1,
    backgroundColor: BRAND.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingCategory: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BRAND.black,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingValue: {
    fontSize: 14,
    color: BRAND.gray,
    marginLeft: 8,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
  },
  overallLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 12,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 4,
  },
  overallValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.yellow,
    marginLeft: 12,
  },
  commentSection: {
    marginBottom: 32,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BRAND.black,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: BRAND.grayLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },
});
