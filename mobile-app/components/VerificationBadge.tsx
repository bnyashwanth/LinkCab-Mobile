import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerification } from "../contexts/VerificationContext";
import { useAuth } from "../contexts/AuthContext";

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
};

interface VerificationBadgeProps {
  userId?: string;
  showFullDetails?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export default function VerificationBadge({
  userId,
  showFullDetails = false,
  compact = false,
  onPress
}: VerificationBadgeProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { verificationStatus } = useVerification();

  // If userId is provided, show verification for that user
  // Otherwise show current user's verification
  const isCurrentUser = !userId || userId === user?.id;
  const status = isCurrentUser ? verificationStatus : profile?.verification_status || 'pending';

  const getVerificationInfo = () => {
    switch (status) {
      case 'verified':
        return {
          icon: 'checkmark-circle',
          color: BRAND.green,
          bgColor: '#DCFCE7',
          text: 'Verified',
          subtext: 'Identity verified',
          trustLevel: 'High',
        };
      case 'under_review':
        return {
          icon: 'time',
          color: BRAND.yellow,
          bgColor: '#FEF3C7',
          text: 'Under Review',
          subtext: 'Verification in progress',
          trustLevel: 'Medium',
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: BRAND.red,
          bgColor: '#FEE2E2',
          text: 'Not Verified',
          subtext: 'Verification failed',
          trustLevel: 'Low',
        };
      case 'submitted':
        return {
          icon: 'document-text',
          color: BRAND.orange,
          bgColor: '#FED7AA',
          text: 'Submitted',
          subtext: 'Documents submitted',
          trustLevel: 'Medium',
        };
      default:
        return {
          icon: 'help-circle',
          color: BRAND.gray,
          bgColor: BRAND.grayLight,
          text: 'Not Verified',
          subtext: 'Complete verification',
          trustLevel: 'Low',
        };
    }
  };

  const verificationInfo = getVerificationInfo();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isCurrentUser) {
      router.push('/(app)/verification');
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: verificationInfo.bgColor }]}
        onPress={handlePress}
        disabled={!isCurrentUser}
      >
        <Ionicons
          name={verificationInfo.icon as any}
          size={16}
          color={verificationInfo.color}
        />
        <Text style={[styles.compactText, { color: verificationInfo.color }]}>
          {verificationInfo.text}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: verificationInfo.bgColor }]}
      onPress={handlePress}
      disabled={!isCurrentUser}
    >
      <View style={styles.leftSection}>
        <Ionicons
          name={verificationInfo.icon as any}
          size={24}
          color={verificationInfo.color}
        />
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: verificationInfo.color }]}>
            {verificationInfo.text}
          </Text>
          <Text style={styles.subtitle}>{verificationInfo.subtext}</Text>
        </View>
      </View>

      {showFullDetails && (
        <View style={styles.rightSection}>
          <View style={styles.trustLevel}>
            <Text style={styles.trustLabel}>Trust Level</Text>
            <Text style={[styles.trustValue, { color: verificationInfo.color }]}>
              {verificationInfo.trustLevel}
            </Text>
          </View>
          {isCurrentUser && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={BRAND.gray}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textSection: {
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: BRAND.gray,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  trustLevel: {
    alignItems: 'flex-end',
  },
  trustLabel: {
    fontSize: 11,
    color: BRAND.gray,
    marginBottom: 2,
  },
  trustValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
