import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerification } from "../contexts/VerificationContext";
import { useAuth } from "../contexts/AuthContext";
import VerificationBadge from './VerificationBadge';

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
  orange: '#F97316',
  blue: '#3B82F6',
};

interface UserVerificationStatusProps {
  userId?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function UserVerificationStatus({
  userId,
  showActions = true,
  compact = false
}: UserVerificationStatusProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    verificationStatus,
    verificationDocuments,
    getVerificationSteps,
    isProfileComplete
  } = useVerification();

  const isCurrentUser = !userId || userId === user?.id;
  const status = isCurrentUser ? verificationStatus : profile?.verification_status || 'pending';
  const steps = getVerificationSteps();

  const getSafetyScore = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getTrustFeatures = () => {
    const features = [];

    if (status === 'verified') {
      features.push(
        '✓ Identity Verified',
        '✓ Document Verified',
        '✓ High Trust Score',
        '✓ Priority Support',
        '✓ Verified Badge'
      );
    } else if (status === 'under_review') {
      features.push(
        '⏳ Documents Submitted',
        '⏳ Under Review',
        '⏳ Pending Verification'
      );
    } else {
      features.push(
        '! Complete Profile',
        '! Upload Documents',
        '! Get Verified'
      );
    }

    return features;
  };

  const handleVerificationPress = () => {
    if (isCurrentUser) {
      router.push('/(app)/verification');
    }
  };

  if (compact) {
    return (
      <VerificationBadge
        userId={userId}
        compact={true}
        onPress={handleVerificationPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Verification Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Verification Status</Text>
          <Text style={styles.subtitle}>
            {isCurrentUser ? 'Complete verification to build trust' : 'User verification status'}
          </Text>
        </View>
        <View style={styles.safetyScore}>
          <Text style={styles.scoreLabel}>Safety Score</Text>
          <Text style={styles.scoreValue}>{getSafetyScore()}%</Text>
        </View>
      </View>

      {/* Verification Badge */}
      <VerificationBadge
        userId={userId}
        showFullDetails={true}
        onPress={handleVerificationPress}
      />

      {/* Progress Steps */}
      {isCurrentUser && (
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Verification Progress</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View style={[
                  styles.stepCircle,
                  step.completed && styles.stepCircleCompleted
                ]}>
                  {step.completed ? (
                    <Ionicons name="checkmark" size={16} color={BRAND.white} />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    step.completed && styles.stepTitleCompleted
                  ]}>
                    {step.title}
                  </Text>
                  {step.completed && (
                    <Text style={styles.stepCompletedText}>Completed</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Trust Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Trust Features</Text>
        <View style={styles.featuresContainer}>
          {getTrustFeatures().map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <View style={styles.tip}>
          <Ionicons name="shield-checkmark" size={20} color={BRAND.green} />
          <Text style={styles.tipText}>
            Verified users have higher trust scores and get more connection requests
          </Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="lock-closed" size={20} color={BRAND.yellow} />
          <Text style={styles.tipText}>
            Your documents are securely stored and only used for verification
          </Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="eye-off" size={20} color={BRAND.blue} />
          <Text style={styles.tipText}>
            Personal information is never shared with other users
          </Text>
        </View>
      </View>

      {/* Action Button */}
      {showActions && isCurrentUser && status !== 'verified' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleVerificationPress}
        >
          <Text style={styles.actionButtonText}>
            {status === 'pending' ? 'Start Verification' :
              status === 'submitted' ? 'View Status' :
                'Retry Verification'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={BRAND.black} />
        </TouchableOpacity>
      )}

      {/* Verified Badge Display */}
      {status === 'verified' && (
        <View style={styles.verifiedSection}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={BRAND.green} />
            <Text style={styles.verifiedText}>Verified User</Text>
          </View>
          <Text style={styles.verifiedSubtext}>
            This user has completed identity verification and has a high trust score
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.gray,
  },
  safetyScore: {
    alignItems: 'center',
    backgroundColor: BRAND.yellowLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: BRAND.gray,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.black,
  },
  progressSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 12,
  },
  stepsContainer: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepCircleCompleted: {
    backgroundColor: BRAND.green,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.gray,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: BRAND.gray,
  },
  stepTitleCompleted: {
    color: BRAND.green,
  },
  stepCompletedText: {
    fontSize: 12,
    color: BRAND.green,
    marginTop: 2,
  },
  featuresSection: {
    marginTop: 20,
  },
  featuresContainer: {
    gap: 8,
  },
  feature: {
    backgroundColor: BRAND.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 14,
    color: BRAND.black,
  },
  tipsSection: {
    marginTop: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: BRAND.gray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginRight: 8,
  },
  verifiedSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.green,
    marginLeft: 8,
  },
  verifiedSubtext: {
    fontSize: 13,
    color: BRAND.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
