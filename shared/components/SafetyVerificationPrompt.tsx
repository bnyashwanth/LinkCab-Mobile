import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

interface SafetyVerificationPromptProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  userName: string;
  verificationStatus: string;
  context: 'ride_request' | 'chat' | 'connection';
}

export default function SafetyVerificationPrompt({
  visible,
  onClose,
  onContinue,
  userName,
  verificationStatus,
  context,
}: SafetyVerificationPromptProps) {
  const router = useRouter();

  const getContextMessage = () => {
    switch (context) {
      case 'ride_request':
        return 'You are about to request a ride with this user.';
      case 'chat':
        return 'You are about to start a conversation with this user.';
      case 'connection':
        return 'You are about to connect with this user for travel.';
      default:
        return 'You are about to interact with this user.';
    }
  };

  const getSafetyTips = () => {
    const tips = [
      '✓ Meet in public places first',
      '✓ Share your trip details with friends',
      '✓ Verify identity before meeting',
      '✓ Use in-app communication',
      '✓ Trust your instincts',
    ];

    if (verificationStatus !== 'verified') {
      tips.unshift('⚠️ This user is not verified');
      tips.unshift('⚠️ Extra caution recommended');
    }

    return tips;
  };

  const handleGetVerified = () => {
    onClose();
    router.push('/(app)/verification');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={BRAND.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safety Check</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Warning Card */}
          <View style={[
            styles.warningCard,
            verificationStatus === 'verified' ? styles.warningCardLow : styles.warningCardHigh
          ]}>
            <View style={styles.warningHeader}>
              <Ionicons 
                name={verificationStatus === 'verified' ? 'shield-checkmark' : 'warning'} 
                size={32} 
                color={verificationStatus === 'verified' ? BRAND.green : BRAND.orange} 
              />
              <View style={styles.warningText}>
                <Text style={[
                  styles.warningTitle,
                  { color: verificationStatus === 'verified' ? BRAND.green : BRAND.orange }
                ]}>
                  {verificationStatus === 'verified' ? 'Verified User' : 'Unverified User'}
                </Text>
                <Text style={styles.warningSubtitle}>
                  {verificationStatus === 'verified' 
                    ? 'This user has completed identity verification'
                    : 'This user has not completed verification'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Context Message */}
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Interaction Details</Text>
            <Text style={styles.contextText}>
              {getContextMessage()}
            </Text>
            <Text style={styles.contextUser}>
              User: <Text style={styles.contextUserName}>{userName}</Text>
            </Text>
          </View>

          {/* Safety Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Safety Guidelines</Text>
            {getSafetyTips().map((tip, index) => (
              <View key={index} style={styles.tip}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Verification Benefits */}
          {verificationStatus !== 'verified' && (
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>Why Verification Matters</Text>
              <View style={styles.benefit}>
                <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
                <Text style={styles.benefitText}>
                  Verified users have higher trust scores
                </Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
                <Text style={styles.benefitText}>
                  Identity verification reduces risks
                </Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
                <Text style={styles.benefitText}>
                  Better match quality with verified users
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.continueButton, 
                verificationStatus === 'verified' ? styles.continueButtonVerified : styles.continueButtonUnverified
              ]}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>
                {verificationStatus === 'verified' ? 'Continue' : 'Continue with Caution'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={BRAND.black} />
            </TouchableOpacity>

            {verificationStatus !== 'verified' && (
              <TouchableOpacity style={styles.verifiedButton} onPress={handleGetVerified}>
                <Ionicons name="shield-checkmark" size={20} color={BRAND.white} />
                <Text style={styles.verifiedButtonText}>Get Verified</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your safety is our priority. Always exercise caution when meeting new people.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  warningCardLow: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: BRAND.green,
  },
  warningCardHigh: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: BRAND.orange,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: 16,
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 14,
    color: BRAND.gray,
  },
  contextCard: {
    backgroundColor: BRAND.grayLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 4,
  },
  contextUser: {
    fontSize: 14,
    color: BRAND.gray,
  },
  contextUserName: {
    fontWeight: '600',
    color: BRAND.black,
  },
  tipsCard: {
    backgroundColor: BRAND.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 12,
  },
  tip: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: BRAND.black,
  },
  benefitsCard: {
    backgroundColor: BRAND.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: BRAND.black,
    marginLeft: 8,
    flex: 1,
  },
  actionSection: {
    marginBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonVerified: {
    backgroundColor: BRAND.green,
  },
  continueButtonUnverified: {
    backgroundColor: BRAND.orange,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    marginRight: 8,
  },
  verifiedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.black,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  verifiedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.gray,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: BRAND.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
