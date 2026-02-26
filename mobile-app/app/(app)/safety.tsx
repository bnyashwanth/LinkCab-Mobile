import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafety } from "../../contexts/SafetyContext";
import { useAuth } from "../../contexts/AuthContext";

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
};

const REPORT_TYPES = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', icon: 'warning-outline', color: BRAND.orange },
  { value: 'safety_concern', label: 'Safety Concern', icon: 'shield-outline', color: BRAND.red },
  { value: 'fraud', label: 'Fraud', icon: 'alert-circle-outline', color: BRAND.red },
  { value: 'harassment', label: 'Harassment', icon: 'person-outline', color: BRAND.red },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: BRAND.gray },
];

export default function SafetyScreen() {
  const router = useRouter();
  const { userId: reportedId, rideId } = useLocalSearchParams<{ userId?: string; rideId?: string }>();
  const { user } = useAuth();
  const {
    submitReport,
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkUserSafety,
    loading
  } = useSafety();

  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userSafetyInfo, setUserSafetyInfo] = useState<{ isBlocked: boolean; hasReports: boolean; trustScore: number } | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (reportedId) {
      checkUserSafetyInfo();
    }
    loadBlockedUsers();
  }, [reportedId]);

  const checkUserSafetyInfo = async () => {
    if (!reportedId) return;

    const safetyInfo = await checkUserSafety(reportedId);
    setUserSafetyInfo(safetyInfo);
  };

  const loadBlockedUsers = async () => {
    const { data } = await getBlockedUsers();
    setBlockedUsers(data || []);
  };

  const handleSubmitReport = async () => {
    if (!selectedReportType) {
      Alert.alert('Report Type Required', 'Please select a reason for your report');
      return;
    }

    if (!reportDescription.trim()) {
      Alert.alert('Description Required', 'Please provide details about your report');
      return;
    }

    if (!reportedId) {
      Alert.alert('Error', 'User ID not provided');
      return;
    }

    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this report? False reports can affect your account standing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await submitReport(
              reportedId,
              selectedReportType as any,
              reportDescription.trim(),
              rideId
            );

            if (success) {
              Alert.alert(
                'Report Submitted',
                'Thank you for helping keep our community safe. We will review your report and take appropriate action.',
                [
                  {
                    text: 'OK', onPress: () => {
                      setShowReportModal(false);
                      setSelectedReportType('');
                      setReportDescription('');
                      checkUserSafetyInfo();
                    }
                  }
                ]
              );
            } else {
              Alert.alert('Error', error?.message || 'Failed to submit report');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async () => {
    if (!reportedId) {
      Alert.alert('Error', 'User ID not provided');
      return;
    }

    const isCurrentlyBlocked = userSafetyInfo?.isBlocked || false;

    Alert.alert(
      isCurrentlyBlocked ? 'Unblock User' : 'Block User',
      isCurrentlyBlocked
        ? 'Are you sure you want to unblock this user? You will be able to see their rides and messages again.'
        : 'Are you sure you want to block this user? You will not see their rides or messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyBlocked ? 'Unblock' : 'Block',
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            const { success, error } = isCurrentlyBlocked
              ? await unblockUser(reportedId)
              : await blockUser(reportedId);

            if (success) {
              Alert.alert(
                'Success',
                isCurrentlyBlocked ? 'User has been unblocked' : 'User has been blocked',
                [
                  {
                    text: 'OK', onPress: () => {
                      checkUserSafetyInfo();
                      loadBlockedUsers();
                    }
                  }
                ]
              );
            } else {
              Alert.alert('Error', error?.message || 'Failed to update block status');
            }
          },
        },
      ]
    );
  };

  const getSafetyLevelColor = (trustScore: number) => {
    if (trustScore >= 75) return BRAND.green;
    if (trustScore >= 50) return BRAND.yellow;
    if (trustScore >= 25) return BRAND.orange;
    return BRAND.red;
  };

  const getSafetyLevelText = (trustScore: number) => {
    if (trustScore >= 75) return 'Excellent';
    if (trustScore >= 50) return 'Good';
    if (trustScore >= 25) return 'Moderate';
    return 'Needs Attention';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Safety Info */}
        {userSafetyInfo && (
          <View style={styles.safetyInfoCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color={BRAND.yellow} />
              <Text style={styles.safetyTitle}>User Safety Information</Text>
            </View>

            <View style={styles.safetyStats}>
              <View style={styles.safetyStat}>
                <Text style={styles.safetyStatLabel}>Trust Score</Text>
                <View style={styles.trustScoreContainer}>
                  <Text style={[
                    styles.trustScore,
                    { color: getSafetyLevelColor(userSafetyInfo.trustScore) }
                  ]}>
                    {userSafetyInfo.trustScore}%
                  </Text>
                  <Text style={[
                    styles.safetyLevel,
                    { color: getSafetyLevelColor(userSafetyInfo.trustScore) }
                  ]}>
                    {getSafetyLevelText(userSafetyInfo.trustScore)}
                  </Text>
                </View>
              </View>

              <View style={styles.safetyStat}>
                <Text style={styles.safetyStatLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  {userSafetyInfo.isBlocked && (
                    <View style={styles.statusBadgeBlocked}>
                      <Ionicons name="ban" size={16} color={BRAND.white} />
                      <Text style={styles.statusTextBlocked}>Blocked</Text>
                    </View>
                  )}
                  {userSafetyInfo.hasReports && (
                    <View style={styles.statusBadgeWarning}>
                      <Ionicons name="warning" size={16} color={BRAND.white} />
                      <Text style={styles.statusTextWarning}>Has Reports</Text>
                    </View>
                  )}
                  {!userSafetyInfo.isBlocked && !userSafetyInfo.hasReports && (
                    <View style={styles.statusBadgeGood}>
                      <Ionicons name="checkmark" size={16} color={BRAND.white} />
                      <Text style={styles.statusTextGood}>Clear</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {reportedId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reportButton]}
                onPress={() => setShowReportModal(true)}
              >
                <Ionicons name="flag-outline" size={20} color={BRAND.white} />
                <Text style={styles.actionButtonText}>Report User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  userSafetyInfo?.isBlocked ? styles.unblockButton : styles.blockButton
                ]}
                onPress={handleBlockUser}
              >
                <Ionicons
                  name={userSafetyInfo?.isBlocked ? 'person-add-outline' : 'person-outline'}
                  size={20}
                  color={BRAND.white}
                />
                <Text style={styles.actionButtonText}>
                  {userSafetyInfo?.isBlocked ? 'Unblock User' : 'Block User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users ({blockedUsers.length})</Text>
          {blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={48} color={BRAND.gray} />
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySubtext}>You haven't blocked any users yet</Text>
            </View>
          ) : (
            <View style={styles.blockedUsersList}>
              {blockedUsers.map((userId, index) => (
                <View key={userId} style={styles.blockedUserItem}>
                  <View style={styles.blockedUserInfo}>
                    <View style={styles.blockedUserAvatar}>
                      <Text style={styles.blockedUserInitials}>U</Text>
                    </View>
                    <View style={styles.blockedUserDetails}>
                      <Text style={styles.blockedUserName}>User {userId.slice(0, 8)}</Text>
                      <Text style={styles.blockedUserSubtext}>Blocked</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.unblockSmallButton}
                    onPress={() => unblockUser(userId)}
                  >
                    <Ionicons name="person-add-outline" size={16} color={BRAND.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Safety Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Guidelines</Text>
          <View style={styles.guidelinesCard}>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.guidelineText}>Always meet in public places</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.guidelineText}>Share your trip details with friends</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.guidelineText}>Trust your instincts</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.guidelineText}>Report suspicious behavior</Text>
            </View>
            <View style={styles.guidelineItem}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.guidelineText}>Keep personal information private</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.emergencyCard}>
            <TouchableOpacity style={styles.emergencyButton}>
              <Ionicons name="call" size={24} color={BRAND.white} />
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>Emergency Services</Text>
                <Text style={styles.emergencyNumber}>112</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyButton}>
              <Ionicons name="shield-checkmark" size={24} color={BRAND.white} />
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>LinkCab Safety</Text>
                <Text style={styles.emergencyNumber}>24/7 Support</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={24} color={BRAND.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report User</Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>What would you like to report?</Text>

            <View style={styles.reportTypes}>
              {REPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.reportTypeCard,
                    selectedReportType === type.value && styles.reportTypeCardSelected
                  ]}
                  onPress={() => setSelectedReportType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={selectedReportType === type.value ? BRAND.white : type.color}
                  />
                  <Text style={[
                    styles.reportTypeText,
                    selectedReportType === type.value && styles.reportTypeTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>Please provide details</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe what happened..."
              placeholderTextColor={BRAND.gray}
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitReportButton,
                (!selectedReportType || !reportDescription.trim()) && styles.submitReportButtonDisabled
              ]}
              onPress={handleSubmitReport}
              disabled={!selectedReportType || !reportDescription.trim() || loading}
            >
              <Text style={styles.submitReportButtonText}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 16,
  },

  // Safety Info Card
  safetyInfoCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
    marginBottom: 24,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginLeft: 8,
  },
  safetyStats: {
    gap: 16,
  },
  safetyStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyStatLabel: {
    fontSize: 14,
    color: BRAND.gray,
  },
  trustScoreContainer: {
    alignItems: 'flex-end',
  },
  trustScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  safetyLevel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadgeBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeGood: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusTextBlocked: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.white,
  },
  statusTextWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.white,
  },
  statusTextGood: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.white,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reportButton: {
    backgroundColor: BRAND.red,
  },
  blockButton: {
    backgroundColor: BRAND.gray,
  },
  unblockButton: {
    backgroundColor: BRAND.green,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },

  // Blocked Users
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 4,
  },
  blockedUsersList: {
    gap: 12,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedUserInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.gray,
  },
  blockedUserDetails: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
  },
  blockedUserSubtext: {
    fontSize: 13,
    color: BRAND.gray,
    marginTop: 2,
  },
  unblockSmallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.green,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Guidelines
  guidelinesCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelineText: {
    fontSize: 14,
    color: BRAND.blackLight,
    marginLeft: 12,
    flex: 1,
  },

  // Emergency
  emergencyCard: {
    gap: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.red,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },
  emergencyNumber: {
    fontSize: 14,
    color: BRAND.white,
    opacity: 0.9,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },
  modalSpacer: {
    width: 24,
  },
  modalContent: {
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 16,
  },
  reportTypes: {
    gap: 12,
    marginBottom: 24,
  },
  reportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    gap: 12,
  },
  reportTypeCardSelected: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  reportTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
  },
  reportTypeTextSelected: {
    color: BRAND.white,
  },
  descriptionInput: {
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    fontSize: 15,
    color: BRAND.black,
    minHeight: 100,
    marginBottom: 24,
  },
  submitReportButton: {
    backgroundColor: BRAND.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitReportButtonDisabled: {
    backgroundColor: BRAND.grayLight,
  },
  submitReportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
});
