import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from "../../constants/theme";

export default function TermsScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.push('/(app)/profile');
    };

    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: 'By accessing and using the LinkCab application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.',
        },
        {
            title: '2. User Registration',
            content: 'To use LinkCab, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.',
        },
        {
            title: '3. Ride Sharing Services',
            content: 'LinkCab facilitates cab sharing between users. We are not a transportation provider. We connect riders who are traveling in the same direction to share costs and reduce environmental impact.',
        },
        {
            title: '4. User Responsibilities',
            content: 'Users are responsible for their conduct during rides. This includes being punctual, respectful to co-riders, and adhering to safety guidelines. Any inappropriate behavior may result in account suspension.',
        },
        {
            title: '5. Payment Terms',
            content: 'Payments are processed securely through our platform. Fares are calculated based on distance, time, and cab type. Users agree to pay the estimated fare at the time of booking.',
        },
        {
            title: '6. Cancellation Policy',
            content: 'Users may cancel rides up to 30 minutes before the scheduled pickup time without penalty. Late cancellations may incur charges as specified in our cancellation policy.',
        },
        {
            title: '7. Privacy',
            content: 'Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.',
        },
        {
            title: '8. Limitation of Liability',
            content: 'LinkCab shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.',
        },
        {
            title: '9. Changes to Terms',
            content: 'We reserve the right to modify these Terms at any time. We will notify users of any changes by updating the date at the top of these Terms and sending notifications through the app.',
        },
        {
            title: '10. Contact Us',
            content: 'If you have any questions about these Terms, please contact us at support@linkcab.in or through the Help & Support section in the app.',
        },
    ];

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
                    <Text style={styles.headerTitle}>Terms & Conditions</Text>
                    <View style={styles.placeholder} />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>LinkCab Terms of Service</Text>
                    <Text style={styles.introDate}>Last Updated: February 2026</Text>
                    <Text style={styles.introText}>
                        Please read these Terms and Conditions carefully before using the LinkCab application.
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.agreementSection}>
                    <Ionicons name="document-text" size={32} color="#FFD700" />
                    <Text style={styles.agreementTitle}>Agreement</Text>
                    <Text style={styles.agreementText}>
                        By using LinkCab, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 LinkCab. All rights reserved.</Text>
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
    introSection: {
        backgroundColor: '#FFF8DC',
        borderRadius: borderRadius.lg,
        padding: spacing[5],
        marginBottom: spacing[6],
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    introTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: '#1A1A1A',
        marginBottom: spacing[2],
    },
    introDate: {
        fontSize: typography.fontSize.sm,
        color: '#6B7280',
        marginBottom: spacing[3],
    },
    introText: {
        fontSize: typography.fontSize.base,
        color: '#333333',
        lineHeight: 22,
    },
    section: {
        marginBottom: spacing[5],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        ...shadows.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: '#1A1A1A',
        marginBottom: spacing[2],
    },
    sectionContent: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    agreementSection: {
        backgroundColor: '#FFF8DC',
        borderRadius: borderRadius.lg,
        padding: spacing[5],
        alignItems: 'center',
        marginTop: spacing[4],
        marginBottom: spacing[6],
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    agreementTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: '#1A1A1A',
        marginTop: spacing[3],
        marginBottom: spacing[2],
    },
    agreementText: {
        fontSize: typography.fontSize.sm,
        color: '#333333',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerText: {
        fontSize: typography.fontSize.xs,
        color: '#6B7280',
    },
});
