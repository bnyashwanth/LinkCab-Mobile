import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from "../../constants/theme";

interface SecurityOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function PrivacySecurityScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/(app)/profile');
  };
  const [options, setOptions] = useState<SecurityOption[]>([
    {
      id: '1',
      label: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      enabled: false,
    },
    {
      id: '2',
      label: 'Face ID / Touch ID',
      description: 'Use biometric authentication for quick access',
      enabled: false,
    },
    {
      id: '3',
      label: 'Location Services',
      description: 'Allow LinkCab to access your location',
      enabled: true,
    },
    {
      id: '4',
      label: 'Push Notifications',
      description: 'Receive ride updates and notifications',
      enabled: true,
    },
    {
      id: '5',
      label: 'Email Notifications',
      description: 'Receive ride receipts and updates via email',
      enabled: true,
    },
    {
      id: '6',
      label: 'Share Ride Status',
      description: 'Share your ride status with trusted contacts',
      enabled: false,
    },
  ]);

  const handleToggle = (id: string) => {
    setOptions(prev =>
      prev.map(option =>
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change will be available soon.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon.'),
        },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert('Coming Soon', 'Data download will be available soon.');
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
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed" size={22} color="#FFD700" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuLabel}>Change Password</Text>
                <Text style={styles.menuDescription}>Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          {options.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                value={option.enabled}
                onValueChange={() => handleToggle(option.id)}
                trackColor={{ false: colors.gray[300], true: '#FFD700' }}
                thumbColor={option.enabled ? '#FFD700' : colors.gray[100]}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDownloadData}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="download-outline" size={22} color="#FFD700" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuLabel}>Download Your Data</Text>
                <Text style={styles.menuDescription}>Get a copy of your personal data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash-outline" size={22} color={colors.danger[600]} />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuLabel, styles.dangerLabel]}>Delete Account</Text>
                <Text style={styles.menuDescription}>Permanently delete your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.danger[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoText}>
            We are committed to protecting your privacy and ensuring the security of your personal information.
            Your data is encrypted and never shared with third parties without your consent.
          </Text>
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
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.md,
  },
  dangerItem: {
    backgroundColor: colors.danger[50],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemContent: {
    marginLeft: spacing[3],
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  dangerLabel: {
    color: colors.danger[600],
  },
  menuDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.md,
  },
  optionContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  infoContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
