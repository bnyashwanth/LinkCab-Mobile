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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmergency } from '@/contexts/EmergencyContext';
import { useAuth } from '@/contexts/AuthContext';

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

const EMERGENCY_TYPES = [
  { value: 'sos', label: 'SOS - Immediate Help', icon: 'warning', color: BRAND.red, severity: 'critical' },
  { value: 'medical', label: 'Medical Emergency', icon: 'medical', color: BRAND.red, severity: 'high' },
  { value: 'accident', label: 'Accident', icon: 'car', color: BRAND.orange, severity: 'high' },
  { value: 'harassment', label: 'Harassment', icon: 'person', color: BRAND.orange, severity: 'medium' },
  { value: 'lost', label: 'Lost/Stranded', icon: 'location', color: BRAND.blue, severity: 'medium' },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    emergencyContacts,
    activeAlerts,
    addEmergencyContact,
    deleteEmergencyContact,
    triggerSOS,
    triggerEmergencyAlert,
    cancelEmergencyAlert,
    loading,
  } = useEmergency();

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false,
  });

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      Alert.alert('Missing Information', 'Please fill in all contact details');
      return;
    }

    const { success, error } = await addEmergencyContact(
      newContact.name,
      newContact.phone,
      newContact.relationship,
      newContact.isPrimary
    );

    if (success) {
      Alert.alert('Success', 'Emergency contact added successfully');
      setShowAddContactModal(false);
      setNewContact({ name: '', phone: '', relationship: '', isPrimary: false });
    } else {
      Alert.alert('Error', error?.message || 'Failed to add contact');
    }
  };

  const handleEmergencyAlert = async () => {
    if (!selectedEmergencyType) {
      Alert.alert('Emergency Type Required', 'Please select an emergency type');
      return;
    }

    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to trigger an emergency alert? This will notify your emergency contacts and may contact emergency services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Alert',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await triggerEmergencyAlert(
              selectedEmergencyType as any,
              undefined, // Current location would be used in real implementation
              emergencyMessage.trim() || undefined
            );

            if (success) {
              Alert.alert(
                'Alert Triggered',
                'Emergency alert has been triggered. Your emergency contacts have been notified.',
                [
                  { text: 'OK', onPress: () => {
                    setShowEmergencyModal(false);
                    setSelectedEmergencyType('');
                    setEmergencyMessage('');
                  }}
                ]
              );
            } else {
              Alert.alert('Error', error?.message || 'Failed to trigger alert');
            }
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      'SOS Emergency',
      'This will trigger an immediate SOS alert to your emergency contacts and emergency services. Continue only in a real emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await triggerSOS();

            if (success) {
              Alert.alert(
                'SOS Triggered',
                'SOS alert has been triggered. Emergency services and your contacts have been notified.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('Error', error?.message || 'Failed to trigger SOS');
            }
          },
        },
      ]
    );
  };

  const handleCancelAlert = (alertId: string) => {
    Alert.alert(
      'Cancel Alert',
      'Are you sure you want to cancel this emergency alert?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await cancelEmergencyAlert(alertId);

            if (success) {
              Alert.alert('Alert Cancelled', 'The emergency alert has been cancelled.');
            } else {
              Alert.alert('Error', error?.message || 'Failed to cancel alert');
            }
          },
        },
      ]
    );
  };

  const getEmergencyColor = (type: string) => {
    const emergency = EMERGENCY_TYPES.find(e => e.value === type);
    return emergency?.color || BRAND.gray;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* SOS Button */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Ionicons name="warning" size={48} color={BRAND.white} />
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>Tap for immediate help</Text>
        </TouchableOpacity>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts ({activeAlerts.length})</Text>
            {activeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertIcon, { backgroundColor: getEmergencyColor(alert.type) }]}>
                    <Ionicons 
                      name={EMERGENCY_TYPES.find(e => e.value === alert.type)?.icon as any || 'warning'} 
                      size={20} 
                      color={BRAND.white} 
                    />
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertType}>
                      {EMERGENCY_TYPES.find(e => e.value === alert.type)?.label || 'Emergency'}
                    </Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelAlertButton}
                    onPress={() => handleCancelAlert(alert.id)}
                  >
                    <Ionicons name="close" size={16} color={BRAND.white} />
                  </TouchableOpacity>
                </View>
                {alert.message && (
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Emergency Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Types</Text>
          <View style={styles.emergencyTypes}>
            {EMERGENCY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.emergencyTypeCard,
                  { borderLeftColor: type.color }
                ]}
                onPress={() => {
                  setSelectedEmergencyType(type.value);
                  setShowEmergencyModal(true);
                }}
              >
                <View style={[styles.emergencyTypeIcon, { backgroundColor: type.color }]}>
                  <Ionicons name={type.icon as any} size={24} color={BRAND.white} />
                </View>
                <View style={styles.emergencyTypeInfo}>
                  <Text style={styles.emergencyTypeTitle}>{type.label}</Text>
                  <Text style={styles.emergencyTypeSeverity}>
                    Severity: {type.severity}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={() => setShowAddContactModal(true)}
            >
              <Ionicons name="add" size={20} color={BRAND.white} />
            </TouchableOpacity>
          </View>
          
          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={BRAND.gray} />
              <Text style={styles.emptyText}>No emergency contacts</Text>
              <Text style={styles.emptySubtext}>Add contacts for emergency situations</Text>
            </View>
          ) : (
            <View style={styles.contactsList}>
              {emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactInitials}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Text>
                      {contact.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                      <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteContactButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Contact',
                        `Are you sure you want to delete ${contact.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const { success, error } = await deleteEmergencyContact(contact.id);
                              if (success) {
                                Alert.alert('Success', 'Contact deleted successfully');
                              } else {
                                Alert.alert('Error', error?.message || 'Failed to delete contact');
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={BRAND.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Emergency Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="call" size={20} color={BRAND.green} />
              <Text style={styles.tipText}>Keep your phone charged and accessible</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="location" size={20} color={BRAND.green} />
              <Text style={styles.tipText}>Share your location with trusted contacts</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="people" size={20} color={BRAND.green} />
              <Text style={styles.tipText}>Keep emergency contacts updated</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark" size={20} color={BRAND.green} />
              <Text style={styles.tipText}>Stay calm and follow safety procedures</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
              <Ionicons name="close" size={24} color={BRAND.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Parent, Spouse, Friend"
                value={newContact.relationship}
                onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryCheckbox,
                newContact.isPrimary && styles.primaryCheckboxSelected
              ]}
              onPress={() => setNewContact({ ...newContact, isPrimary: !newContact.isPrimary })}
            >
              <Ionicons 
                name={newContact.isPrimary ? 'checkmark-circle' : 'radio-button-off'} 
                size={20} 
                color={newContact.isPrimary ? BRAND.yellow : BRAND.gray} 
              />
              <Text style={[
                styles.primaryCheckboxText,
                newContact.isPrimary && styles.primaryCheckboxTextSelected
              ]}>
                Set as primary contact
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddContact}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Contact'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Emergency Alert Modal */}
      <Modal
        visible={showEmergencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEmergencyModal(false)}>
              <Ionicons name="close" size={24} color={BRAND.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Emergency Alert</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {EMERGENCY_TYPES.find(e => e.value === selectedEmergencyType)?.label}
            </Text>
            
            <Text style={styles.modalDescription}>
              This will notify your emergency contacts and may contact emergency services depending on the situation.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Information (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your situation..."
                value={emergencyMessage}
                onChangeText={setEmergencyMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.emergencySubmitButton}
              onPress={handleEmergencyAlert}
              disabled={loading}
            >
              <Text style={styles.emergencySubmitButtonText}>
                {loading ? 'Triggering...' : 'Trigger Emergency Alert'}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  // SOS Button
  sosButton: {
    backgroundColor: BRAND.red,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  sosText: {
    fontSize: 32,
    fontWeight: '700',
    color: BRAND.white,
    marginTop: 8,
  },
  sosSubtext: {
    fontSize: 14,
    color: BRAND.white,
    opacity: 0.9,
  },

  // Active Alerts
  alertCard: {
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
    color: BRAND.gray,
  },
  cancelAlertButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: BRAND.blackLight,
    lineHeight: 20,
  },

  // Emergency Types
  emergencyTypes: {
    gap: 12,
  },
  emergencyTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    borderLeftWidth: 4,
    gap: 12,
  },
  emergencyTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTypeInfo: {
    flex: 1,
  },
  emergencyTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
  },
  emergencyTypeSeverity: {
    fontSize: 12,
    color: BRAND.gray,
    fontStyle: 'italic',
  },

  // Emergency Contacts
  addContactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  contactInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryText: {
    fontSize: 8,
    fontWeight: '600',
    color: BRAND.black,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: BRAND.gray,
  },
  deleteContactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tips
  tipsCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: BRAND.blackLight,
    marginLeft: 12,
    flex: 1,
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
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: BRAND.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    padding: 16,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    fontSize: 15,
    color: BRAND.black,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    marginBottom: 20,
  },
  primaryCheckboxSelected: {
    backgroundColor: BRAND.yellowLight,
    borderColor: BRAND.yellow,
  },
  primaryCheckboxText: {
    fontSize: 14,
    color: BRAND.gray,
    marginLeft: 8,
  },
  primaryCheckboxTextSelected: {
    color: BRAND.black,
  },
  submitButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
  },
  emergencySubmitButton: {
    backgroundColor: BRAND.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emergencySubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
});
