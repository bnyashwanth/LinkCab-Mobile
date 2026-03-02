import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../../contexts/AuthContext";
import { colors, typography, spacing, borderRadius, shadows } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import { decode } from 'base64-arraybuffer';
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

interface FormData {
  full_name: string;
  phone: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: profile?.full_name || '',
    phone: profile?.phone || profile?.phone_number || '',
  });

  useEffect(() => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || profile?.phone_number || '',
    });
  }, [profile]);

  const handleBack = () => {
    router.push('/(app)/profile');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: pickFromCamera },
          { text: 'Gallery', onPress: pickFromGallery },
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
        Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
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
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
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

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    try {
      setLoading(true);
      const { error } = await updateProfile({
        full_name: formData.full_name.trim(),
        phone_number: formData.phone.trim() || null,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletion = () => {
    let completed = 0;
    const total = 3; // name, phone, avatar

    if (formData.full_name.trim()) completed++;
    if (formData.phone.trim()) completed++;
    if (profile?.avatar_url) completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>
                    {(formData.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>

          <View style={styles.completionContainer}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Profile Completion</Text>
              <Text style={styles.completionPercentage}>{getProfileCompletion()}%</Text>
            </View>
            <View style={styles.completionBar}>
              <View
                style={[styles.completionFill, { width: `${getProfileCompletion()}%` }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            value={formData.full_name}
            onChangeText={(value) => handleInputChange('full_name', value)}
            placeholder="Enter your full name"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            returnKeyType="done"
          />

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color={colors.gray[500]} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            disabled={loading || uploading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[6],
    paddingBottom: spacing[12],
  },
  profileCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginTop: -spacing[4],
    alignItems: 'center',
    ...shadows.lg,
  },
  avatarContainer: {
    marginBottom: spacing[3],
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  completionContainer: {
    width: '100%',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  completionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  completionPercentage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
  },
  completionBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  formContainer: {
    marginTop: spacing[6],
  },
  infoContainer: {
    marginTop: spacing[4],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginLeft: spacing[3],
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    color: '#000',
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    marginTop: spacing[8],
  },
  saveButton: {
    marginBottom: spacing[4],
  },
});
