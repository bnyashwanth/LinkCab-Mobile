import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from "../../constants/theme";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
}

export default function HelpSupportScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/(app)/profile');
  };
  const [message, setMessage] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'How do I book a ride?',
      answer: 'Simply enter your pickup and drop-off locations, select your preferred cab type, and confirm your booking. You can track your driver in real-time.',
      expanded: false,
    },
    {
      id: '2',
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards, UPI, and digital wallets. You can add multiple payment methods in the app.',
      expanded: false,
    },
    {
      id: '3',
      question: 'How can I cancel my ride?',
      answer: 'You can cancel your ride from the active ride screen. Cancellation charges may apply if the driver has already accepted your request.',
      expanded: false,
    },
    {
      id: '4',
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption to protect your personal and payment information. Your data is never shared without your consent.',
      expanded: false,
    },
    {
      id: '5',
      question: 'How do I report an issue with my ride?',
      answer: 'You can report issues through the ride history section or contact our support team directly through the app.',
      expanded: false,
    },
  ]);

  const toggleFAQ = (id: string) => {
    setFaqs(prev =>
      prev.map(faq =>
        faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
      )
    );
  };

  const handleContactSupport = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => sendEmail() },
        { text: 'Call', onPress: () => makeCall() },
      ]
    );
  };

  const sendEmail = () => {
    const email = 'support@linkcab.in';
    const subject = 'Support Request';
    const body = message;

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const makeCall = () => {
    const phoneNumber = '+919876543210';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'For immediate assistance, call our 24/7 emergency hotline.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL('tel:911') },
      ]
    );
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Linking.openURL('tel:+919876543210')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={24} color="#FFD700" />
              <Text style={styles.quickActionText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Linking.openURL('mailto:support@linkcab.in')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail" size={24} color="#FFD700" />
              <Text style={styles.quickActionText}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, styles.emergencyAction]}
              onPress={handleEmergencyContact}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle" size={24} color={colors.danger[600]} />
              <Text style={[styles.quickActionText, styles.emergencyText]}>Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={faq.expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.gray[400]}
                />
              </TouchableOpacity>

              {faq.expanded && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>

          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue or question..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Support Hours</Text>
          <Text style={styles.infoText}>
            Monday - Friday: 9:00 AM - 9:00 PM
          </Text>
          <Text style={styles.infoText}>
            Saturday - Sunday: 10:00 AM - 6:00 PM
          </Text>
          <Text style={styles.infoText}>
            Emergency Support: 24/7
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
    marginHorizontal: spacing[1],
    ...shadows.md,
  },
  emergencyAction: {
    backgroundColor: colors.danger[50],
  },
  quickActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  emergencyText: {
    color: colors.danger[600],
  },
  faqItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...shadows.md,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  faqQuestionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginRight: spacing[3],
  },
  faqAnswer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  faqAnswerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  messageContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.md,
  },
  messageInput: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing[4],
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#fff',
    marginLeft: spacing[2],
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
    marginBottom: spacing[1],
  },
});
