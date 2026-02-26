import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRide } from "../../contexts/RideContext";
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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
};

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const popularLocations: Location[] = [
  { id: '1', name: 'Bangalore Airport', address: 'Kempegowda International Airport, Devanahalli', latitude: 13.1986, longitude: 77.7066 },
  { id: '2', name: 'MG Road Metro', address: 'MG Road, Bangalore 560001', latitude: 12.9768, longitude: 77.6033 },
  { id: '3', name: 'Electronic City Phase 1', address: 'Electronic City, Bangalore 560100', latitude: 12.8399, longitude: 77.6770 },
  { id: '4', name: 'Whitefield IT Hub', address: 'Whitefield, Bangalore 560066', latitude: 12.9698, longitude: 77.7498 },
  { id: '5', name: 'Indiranagar', address: '100 Feet Road, Indiranagar, Bangalore', latitude: 12.9784, longitude: 77.6408 },
  { id: '6', name: 'Koramangala', address: '80 Feet Road, Koramangala, Bangalore', latitude: 12.9352, longitude: 77.6245 },
  { id: '7', name: 'HSR Layout', address: 'Sector 1, HSR Layout, Bangalore', latitude: 12.9116, longitude: 77.6389 },
  { id: '8', name: 'Marathahalli', address: 'Marathahalli Bridge, Bangalore', latitude: 12.9591, longitude: 77.6974 },
  { id: '9', name: 'Majestic Bus Stand', address: 'Kempegowda Bus Station, Bangalore', latitude: 12.9767, longitude: 77.5713 },
  { id: '10', name: 'Silk Board Junction', address: 'BTM Layout, Bangalore', latitude: 12.9172, longitude: 77.6227 },
];

const cabTypes = [
  { label: 'Sedan', value: 'sedan', icon: 'car-outline' },
  { label: 'SUV', value: 'suv', icon: 'car-sport-outline' },
  { label: 'Hatchback', value: 'hatchback', icon: 'car-outline' },
  { label: 'Auto', value: 'auto', icon: 'bicycle-outline' },
];

const genderPreferences = [
  { label: 'Any', value: 'any', icon: 'people-outline' },
  { label: 'Male', value: 'male', icon: 'man-outline' },
  { label: 'Female', value: 'female', icon: 'woman-outline' },
];

export default function CreateRideScreen() {
  const router = useRouter();
  const { createRide } = useRide();
  const { user } = useAuth();

  // Form State
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [selectedCabType, setSelectedCabType] = useState('sedan');
  const [availableSeats, setAvailableSeats] = useState(1);
  const [genderPreference, setGenderPreference] = useState('any');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date/Time State
  const [rideDate, setRideDate] = useState(new Date());
  const [rideTime, setRideTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'pickup' | 'dropoff'>('pickup');
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    if (pickup && dropoff) {
      const distance = calculateDistance(pickup, dropoff);
    }
  }, [pickup, dropoff, selectedCabType]);

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371;
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRideDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setRideTime(selectedTime);
    }
  };

  const filteredLocations = popularLocations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.address.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleCreateRide = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please select both pickup and dropoff locations');
      return;
    }

    if (pickup.id === dropoff.id) {
      Alert.alert('Invalid Route', 'Pickup and dropoff locations cannot be the same');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRide({
        pickup_location: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          address: pickup.address,
        },
        dropoff_location: {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
          address: dropoff.address,
        },
        ride_date: rideDate.toISOString().split('T')[0],
        ride_time: formatTime(rideTime),
        available_seats: availableSeats,
        cab_type: selectedCabType,
        gender_preference: genderPreference,
        notes: notes || undefined,
      });

      if (result.error) {
        Alert.alert('Error', result.error.message || 'Failed to create ride');
      } else {
        Alert.alert('Success', 'Ride created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(app)/announcements') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const swapLocations = () => {
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ride</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>

          <View style={styles.routeCard}>
            {/* Pickup */}
            <TouchableOpacity
              style={styles.locationInput}
              onPress={() => {
                setLocationModalType('pickup');
                setLocationSearch('');
                setShowLocationModal(true);
              }}
            >
              <View style={[styles.locationDot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={[styles.locationValue, !pickup && styles.locationPlaceholder]} numberOfLines={1}>
                  {pickup ? pickup.name : 'Select pickup point'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.gray} />
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
              <Ionicons name="swap-vertical" size={20} color={BRAND.black} />
            </TouchableOpacity>

            <View style={styles.locationDivider} />

            {/* Dropoff */}
            <TouchableOpacity
              style={styles.locationInput}
              onPress={() => {
                setLocationModalType('dropoff');
                setLocationSearch('');
                setShowLocationModal(true);
              }}
            >
              <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Drop-off Location</Text>
                <Text style={[styles.locationValue, !dropoff && styles.locationPlaceholder]} numberOfLines={1}>
                  {dropoff ? dropoff.name : 'Select drop-off point'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.scheduleRow}>
            {/* Date Picker */}
            <TouchableOpacity
              style={styles.scheduleCard}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar-outline" size={22} color={BRAND.black} />
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{formatDate(rideDate)}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={BRAND.gray} />
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity
              style={styles.scheduleCard}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.scheduleIcon}>
                <Ionicons name="time-outline" size={22} color={BRAND.black} />
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>{formatTime(rideTime)}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={BRAND.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cab Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.cabTypesGrid}>
            {cabTypes.map((cab) => (
              <TouchableOpacity
                key={cab.value}
                style={[
                  styles.cabTypeCard,
                  selectedCabType === cab.value && styles.cabTypeCardSelected
                ]}
                onPress={() => setSelectedCabType(cab.value)}
              >
                <View style={[
                  styles.cabTypeIconContainer,
                  selectedCabType === cab.value && styles.cabTypeIconContainerSelected
                ]}>
                  <Ionicons
                    name={cab.icon as any}
                    size={24}
                    color={selectedCabType === cab.value ? BRAND.black : BRAND.gray}
                  />
                </View>
                <Text style={[
                  styles.cabTypeName,
                  selectedCabType === cab.value && styles.cabTypeNameSelected
                ]}>{cab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Seats</Text>
          <View style={styles.seatsContainer}>
            {[1, 2, 3, 4].map((seat) => (
              <TouchableOpacity
                key={seat}
                style={[
                  styles.seatButton,
                  availableSeats === seat && styles.seatButtonSelected
                ]}
                onPress={() => setAvailableSeats(seat)}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={availableSeats === seat ? BRAND.black : BRAND.gray}
                />
                <Text style={[
                  styles.seatButtonText,
                  availableSeats === seat && styles.seatButtonTextSelected
                ]}>{seat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gender Preference Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Co-passenger Preference</Text>
          <View style={styles.genderContainer}>
            {genderPreferences.map((pref) => (
              <TouchableOpacity
                key={pref.value}
                style={[
                  styles.genderButton,
                  genderPreference === pref.value && styles.genderButtonSelected
                ]}
                onPress={() => setGenderPreference(pref.value)}
              >
                <Ionicons
                  name={pref.icon as any}
                  size={20}
                  color={genderPreference === pref.value ? BRAND.black : BRAND.gray}
                />
                <Text style={[
                  styles.genderButtonText,
                  genderPreference === pref.value && styles.genderButtonTextSelected
                ]}>{pref.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="E.g., Luggage space needed, pet-friendly, etc."
            placeholderTextColor={BRAND.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleCreateRide}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={BRAND.black} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={BRAND.black} />
              <Text style={styles.createButtonText}>Create Ride</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={rideDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={rideTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {locationModalType === 'pickup' ? 'Pickup' : 'Drop-off'} Location
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLocationModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.black} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={BRAND.yellow} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                placeholderTextColor={BRAND.gray}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')}>
                  <Ionicons name="close-circle" size={20} color={BRAND.gray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Locations List */}
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              style={styles.locationsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  (locationModalType === 'pickup' && pickup?.id === item.id) ||
                  (locationModalType === 'dropoff' && dropoff?.id === item.id);

                return (
                  <TouchableOpacity
                    style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                    onPress={() => {
                      if (locationModalType === 'pickup') {
                        setPickup(item);
                      } else {
                        setDropoff(item);
                      }
                      setShowLocationModal(false);
                    }}
                  >
                    <View style={[styles.locationItemIcon, isSelected && styles.locationItemIconSelected]}>
                      <Ionicons
                        name="location"
                        size={20}
                        color={isSelected ? BRAND.black : BRAND.gray}
                      />
                    </View>
                    <View style={styles.locationItemInfo}>
                      <Text style={[styles.locationItemName, isSelected && styles.locationItemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.locationItemAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Ionicons name="checkmark" size={16} color={BRAND.black} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color={BRAND.grayMedium} />
                  <Text style={styles.emptyStateText}>No locations found</Text>
                </View>
              )}
            />
          </View>
        </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 12,
  },

  // Route Card
  routeCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: BRAND.gray,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
  },
  locationPlaceholder: {
    color: BRAND.gray,
    fontWeight: '400',
  },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  locationDivider: {
    height: 1,
    backgroundColor: BRAND.grayMedium,
    marginLeft: 36,
    marginRight: 12,
  },

  // Price Card
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.black,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.yellow,
  },

  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: BRAND.gray,
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
  },

  // Cab Types
  cabTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cabTypeCard: {
    width: (width - 42) / 2,
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  cabTypeCardSelected: {
    borderColor: BRAND.yellow,
    backgroundColor: BRAND.yellowLight,
  },
  cabTypeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cabTypeIconContainerSelected: {
    backgroundColor: BRAND.yellow,
  },
  cabTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
  },
  cabTypeNameSelected: {
    color: BRAND.black,
  },
  cabTypePrice: {
    fontSize: 12,
    color: BRAND.gray,
  },

  // Seats
  seatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  seatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    gap: 6,
  },
  seatButtonSelected: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  seatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.gray,
  },
  seatButtonTextSelected: {
    color: BRAND.black,
  },

  // Gender
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    gap: 6,
  },
  genderButtonSelected: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.gray,
  },
  genderButtonTextSelected: {
    color: BRAND.black,
  },

  // Notes
  notesInput: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: BRAND.black,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    minHeight: 80,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: BRAND.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    borderRadius: 14,
    margin: 16,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: BRAND.black,
  },
  locationsList: {
    maxHeight: height * 0.5,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  locationItemSelected: {
    backgroundColor: BRAND.yellowLight,
  },
  locationItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationItemIconSelected: {
    backgroundColor: BRAND.yellow,
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  locationItemNameSelected: {
    color: BRAND.black,
  },
  locationItemAddress: {
    fontSize: 13,
    color: BRAND.gray,
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: BRAND.grayMedium,
    marginLeft: 76,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: BRAND.gray,
  },
});
