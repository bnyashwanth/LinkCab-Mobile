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
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVerification } from "../../contexts/VerificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';

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

const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
];

export default function VerificationScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { 
    verificationStatus, 
    verificationDocuments, 
    isProfileComplete, 
    loading, 
    uploadDocument, 
    submitVerification, 
    getVerificationSteps 
  } = useVerification();

  const [selectedDocType, setSelectedDocType] = useState('aadhaar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phone_number || '');
      setDateOfBirth(profile.date_of_birth || '');
      setAddress(profile.address || '');
      if (profile.verification_documents?.documentType) {
        setSelectedDocType(profile.verification_documents.documentType);
      }
      if (profile.verification_documents?.documentNumber) {
        setDocumentNumber(profile.verification_documents.documentNumber);
      }
    }
  }, [profile]);

  const handleImageUpload = async (type: 'id' | 'selfie') => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Validate file size (max 5MB)
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }

        // Validate file type
        const validTypes = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExt = asset.uri?.split('.').pop()?.toLowerCase();
        if (!fileExt || !validTypes.includes(fileExt)) {
          Alert.alert('Error', 'Please select a valid image file (JPG, PNG, or WebP)');
          return;
        }

        const { success, error } = await uploadDocument(
          type, 
          asset, 
          type === 'id' ? selectedDocType : undefined,
          type === 'id' ? documentNumber : undefined
        );

        if (success) {
          Alert.alert('Success', `${type === 'id' ? 'ID Document' : 'Selfie'} uploaded successfully`);
        } else {
          const errorMessage = error?.message || 'Failed to upload document';
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!phoneNumber) {
      Alert.alert('Missing Information', 'Please fill in your phone number');
      return;
    }

    // For now, only update phone number since other fields need database migration
    const { error } = await updateProfile({
      phone_number: phoneNumber,
      // date_of_birth: dateOfBirth,  // Uncomment after migration is applied
      // address: address,            // Uncomment after migration is applied
    });

    if (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error?.message || 'Failed to update profile. Please try again.');
    } else {
      Alert.alert('Success', 'Phone number updated successfully');
      // Note: Date of birth and address will be saved after database migration
      if (dateOfBirth || address) {
        Alert.alert(
          'Info', 
          'Phone number updated. Date of birth and address will be saved after system update.'
        );
      }
    }
  };

  const handleSubmitVerification = async () => {
    if (!isProfileComplete) {
      Alert.alert('Incomplete Profile', 'Please complete all verification steps before submitting');
      return;
    }

    const { success, error } = await submitVerification();
    if (success) {
      Alert.alert('Submitted', 'Your verification has been submitted for review');
    } else {
      Alert.alert('Error', error?.message || 'Failed to submit verification');
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified': return BRAND.green;
      case 'rejected': return BRAND.red;
      case 'under_review': return BRAND.yellow;
      default: return BRAND.gray;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Verification Failed';
      case 'under_review': return 'Under Review';
      case 'submitted': return 'Documents Submitted';
      default: return 'Not Started';
    }
  };

  const steps = getVerificationSteps();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Verification Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          {verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
              <Text style={styles.verifiedText}>Verified User</Text>
            </View>
          )}
        </View>

        {/* Progress Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Progress</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View style={styles.stepNumber}>
                  {step.completed ? (
                    <Ionicons name="checkmark" size={16} color={BRAND.white} />
                  ) : (
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              editable={verificationStatus !== 'under_review' && verificationStatus !== 'verified'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="DD/MM/YYYY"
              editable={verificationStatus !== 'under_review' && verificationStatus !== 'verified'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your full address"
              multiline
              numberOfLines={3}
              editable={verificationStatus !== 'under_review' && verificationStatus !== 'verified'}
            />
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateProfile}
            disabled={loading || verificationStatus === 'under_review' || verificationStatus === 'verified'}
          >
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Document Upload */}
        {verificationStatus !== 'under_review' && verificationStatus !== 'verified' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Upload</Text>

            {/* Document Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Document Type *</Text>
              <View style={styles.documentTypes}>
                {DOCUMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.documentType,
                      selectedDocType === type.value && styles.documentTypeSelected
                    ]}
                    onPress={() => setSelectedDocType(type.value)}
                  >
                    <Text style={[
                      styles.documentTypeText,
                      selectedDocType === type.value && styles.documentTypeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Document Number *</Text>
              <TextInput
                style={styles.input}
                value={documentNumber}
                onChangeText={setDocumentNumber}
                placeholder="Enter document number"
              />
            </View>

            {/* ID Document Upload */}
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => handleImageUpload('id')}
            >
              <View style={styles.uploadContent}>
                {verificationDocuments?.idDocumentUrl ? (
                  <Image source={{ uri: verificationDocuments.idDocumentUrl }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="camera-outline" size={48} color={BRAND.gray} />
                    <Text style={styles.uploadText}>Upload ID Document</Text>
                    <Text style={styles.uploadSubtext}>Front side of your ID card</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Selfie Upload */}
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={() => handleImageUpload('selfie')}
            >
              <View style={styles.uploadContent}>
                {verificationDocuments?.selfieUrl ? (
                  <Image source={{ uri: verificationDocuments.selfieUrl }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="person-outline" size={48} color={BRAND.gray} />
                    <Text style={styles.uploadText}>Upload Selfie</Text>
                    <Text style={styles.uploadSubtext}>Clear photo of your face</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        {verificationStatus === 'submitted' && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitVerification}
            disabled={loading || !isProfileComplete}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BRAND.black} />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Review</Text>
            )}
          </TouchableOpacity>
        )}

        {verificationStatus === 'rejected' && (
          <View style={styles.rejectionNotice}>
            <Ionicons name="alert-circle" size={24} color={BRAND.red} />
            <Text style={styles.rejectionText}>
              Your verification was rejected. Please review your documents and try again.
            </Text>
          </View>
        )}

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

  // Status Card
  statusCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.green,
    marginLeft: 6,
  },

  // Steps
  stepsContainer: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.gray,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: BRAND.gray,
  },
  stepTitleCompleted: {
    color: BRAND.green,
  },

  // Form
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: BRAND.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    fontSize: 15,
    color: BRAND.black,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
  },

  // Document Types
  documentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentType: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  documentTypeSelected: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  documentTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.gray,
  },
  documentTypeTextSelected: {
    color: BRAND.black,
  },

  // Upload
  uploadCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadContent: {
    aspectRatio: 3 / 2,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 13,
    color: BRAND.gray,
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Submit
  submitButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Rejection
  rejectionNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rejectionText: {
    fontSize: 14,
    color: BRAND.red,
    marginLeft: 8,
    flex: 1,
  },
});
