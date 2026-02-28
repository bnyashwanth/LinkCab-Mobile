import React, { useMemo, useState } from 'react';
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRide } from '../../contexts/RideContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF8DC',
  black: '#1A1A1A',
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

type BookingApp = 'uber' | 'ola' | 'rapido' | 'other';

const bookingApps: { label: string; value: BookingApp }[] = [
  { label: 'Uber', value: 'uber' },
  { label: 'Ola', value: 'ola' },
  { label: 'Rapido', value: 'rapido' },
  { label: 'Other', value: 'other' },
];

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

const CREATE_RIDE_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Ride creation timeout')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export default function CreateRideScreen() {
  const router = useRouter();
  const { createRide } = useRide();
  const { user } = useAuth();

  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [selectedCabType, setSelectedCabType] = useState('sedan');
  const [availableSeats, setAvailableSeats] = useState(1);
  const [genderPreference, setGenderPreference] = useState('any');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingApp, setBookingApp] = useState<BookingApp>('uber');
  const [totalFareInput, setTotalFareInput] = useState('');
  const [allowSmoking, setAllowSmoking] = useState(false);
  const [allowPets, setAllowPets] = useState(false);
  const [vibeFriendly, setVibeFriendly] = useState(true);
  const [creatorSmallBags, setCreatorSmallBags] = useState(0);
  const [creatorMediumBags, setCreatorMediumBags] = useState(0);
  const [creatorLargeBags, setCreatorLargeBags] = useState(0);
  const [notePhotos, setNotePhotos] = useState<string[]>([]);

  const [rideDate, setRideDate] = useState(new Date());
  const [rideTime, setRideTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'pickup' | 'dropoff'>('pickup');
  const [locationSearch, setLocationSearch] = useState('');

  const totalFare = Number(totalFareInput || 0);
  const totalPeople = availableSeats + 1; // co-passengers + creator
  const perPersonEstimate = useMemo(() => {
    if (!totalFare || totalPeople <= 0) return 0;
    return Math.round((totalFare / totalPeople) * 100) / 100;
  }, [totalFare, totalPeople]);
  const formatInr = (amount: number) => `INR ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRideDate(selectedDate);
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setRideTime(selectedTime);
    }
  };

  const filteredLocations = popularLocations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.address.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileExt = (uri.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('ride-notes')
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (error || !data) {
        console.error('Photo upload failed', error);
        return null;
      }

      const { data: publicData } = supabase.storage.from('ride-notes').getPublicUrl(fileName);
      return publicData.publicUrl;
    } catch (e) {
      console.error('Upload exception', e);
      return null;
    }
  };

  const pickNotePhoto = async (source: 'camera' | 'gallery') => {
    if (notePhotos.length >= 4) {
      Alert.alert('Limit reached', 'You can attach up to 4 note photos.');
      return;
    }

    try {
      if (source === 'camera') {
        const camPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (camPermission.status !== 'granted') {
          Alert.alert('Permission denied', 'Camera permission is required.');
          return;
        }
      } else {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaPermission.status !== 'granted') {
          Alert.alert('Permission denied', 'Gallery permission is required.');
          return;
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

      if (!result.canceled && result.assets[0]?.uri) {
        setNotePhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image picker error', error);
      Alert.alert('Error', 'Unable to attach photo right now.');
    }
  };

  const removePhotoAt = (index: number) => {
    setNotePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateRide = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please select both pickup and drop-off locations');
      return;
    }

    if (pickup.id === dropoff.id) {
      Alert.alert('Invalid Route', 'Pickup and drop-off locations cannot be the same');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const photoUri of notePhotos) {
        const uploaded = await uploadPhoto(photoUri);
        if (uploaded) uploadedUrls.push(uploaded);
      }

      const preferenceNotes = [
        allowSmoking ? 'Smoking allowed' : 'No smoking',
        allowPets ? 'Pets allowed' : 'No pets',
        vibeFriendly ? 'Open to convo/music' : 'Quiet ride preferred',
      ].join(' | ');

      const mergedNotes = [notes.trim(), preferenceNotes].filter(Boolean).join(' | ');

      const payload = {
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
        estimated_fare: Number.isFinite(totalFare) ? totalFare : 0,
        ride_date: rideDate.toISOString().split('T')[0],
        ride_time: formatTime(rideTime),
        available_seats: availableSeats,
        cab_type: selectedCabType,
        gender_preference: genderPreference,
        notes: mergedNotes || undefined,
        booking_app: bookingApp,
        note_photo_urls: uploadedUrls,
        creator_small_bags: creatorSmallBags,
        creator_medium_bags: creatorMediumBags,
        creator_large_bags: creatorLargeBags,
      } as const;

      const result = await withTimeout(createRide(payload), CREATE_RIDE_TIMEOUT_MS);

      if (result.error) {
        Alert.alert('Error', result.error.message || 'Failed to create ride');
      } else {
        Alert.alert('Success', 'Ride created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(app)/announcements') },
        ]);
      }
    } catch (error: any) {
      if (error?.message === 'Ride creation timeout') {
        Alert.alert('Taking too long', 'Ride creation timed out. Please try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ride</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeCard}>
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

            <View style={styles.locationDivider} />

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <TouchableOpacity style={styles.scheduleCard} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={BRAND.black} />
              <Text style={styles.scheduleText}>{formatDate(rideDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleCard} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color={BRAND.black} />
              <Text style={styles.scheduleText}>{formatTime(rideTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & Capacity</Text>
          <View style={styles.cabTypesGrid}>
            {cabTypes.map(cab => (
              <TouchableOpacity
                key={cab.value}
                style={[styles.cabTypeCard, selectedCabType === cab.value && styles.cabTypeCardSelected]}
                onPress={() => setSelectedCabType(cab.value)}
              >
                <Ionicons name={cab.icon as any} size={22} color={selectedCabType === cab.value ? BRAND.black : BRAND.gray} />
                <Text style={styles.cabTypeName}>{cab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.seatsContainer}>
            {[1, 2, 3, 4].map(seat => (
              <TouchableOpacity
                key={seat}
                style={[styles.seatButton, availableSeats === seat && styles.seatButtonSelected]}
                onPress={() => setAvailableSeats(seat)}
              >
                <Text style={styles.seatButtonText}>{seat} seat{seat > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={totalFareInput}
            onChangeText={setTotalFareInput}
            placeholder="Total cab fare (INR)"
            placeholderTextColor={BRAND.gray}
          />
          <View style={styles.fareBreakdown}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>{formatInr(totalFare)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Split Between</Text>
              <Text style={styles.fareValue}>{totalPeople} people</Text>
            </View>
            <View style={[styles.fareRow, styles.fareRowHighlight]}>
              <Text style={styles.fareHighlightLabel}>Per Person</Text>
              <Text style={styles.fareHighlightValue}>{formatInr(perPersonEstimate)}</Text>
            </View>
          </View>
          <Text style={styles.helperText}>Includes you + {availableSeats} co-passenger{availableSeats > 1 ? 's' : ''}.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking App</Text>
          <View style={styles.pillRow}>
            {bookingApps.map(app => (
              <TouchableOpacity
                key={app.value}
                style={[styles.pill, bookingApp === app.value && styles.pillActive]}
                onPress={() => setBookingApp(app.value)}
              >
                <Text style={[styles.pillText, bookingApp === app.value && styles.pillTextActive]}>{app.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Co-passenger Preferences</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity style={[styles.pill, allowSmoking && styles.pillActive]} onPress={() => setAllowSmoking(v => !v)}>
              <Text style={[styles.pillText, allowSmoking && styles.pillTextActive]}>Smoking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, allowPets && styles.pillActive]} onPress={() => setAllowPets(v => !v)}>
              <Text style={[styles.pillText, allowPets && styles.pillTextActive]}>Pets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, vibeFriendly && styles.pillActive]} onPress={() => setVibeFriendly(v => !v)}>
              <Text style={[styles.pillText, vibeFriendly && styles.pillTextActive]}>Vibe</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Luggage</Text>
          <View style={styles.bagRow}>
            <Text style={styles.bagLabel}>Small</Text>
            <BagStepper value={creatorSmallBags} onChange={setCreatorSmallBags} />
          </View>
          <View style={styles.bagRow}>
            <Text style={styles.bagLabel}>Medium</Text>
            <BagStepper value={creatorMediumBags} onChange={setCreatorMediumBags} />
          </View>
          <View style={styles.bagRow}>
            <Text style={styles.bagLabel}>Large</Text>
            <BagStepper value={creatorLargeBags} onChange={setCreatorLargeBags} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Co-passenger Preference</Text>
          <View style={styles.genderContainer}>
            {genderPreferences.map(pref => (
              <TouchableOpacity
                key={pref.value}
                style={[styles.genderButton, genderPreference === pref.value && styles.genderButtonSelected]}
                onPress={() => setGenderPreference(pref.value)}
              >
                <Ionicons name={pref.icon as any} size={18} color={genderPreference === pref.value ? BRAND.black : BRAND.gray} />
                <Text style={styles.genderButtonText}>{pref.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Anything your co-passengers should know?"
            placeholderTextColor={BRAND.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.photoButtonsRow}>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickNotePhoto('camera')}>
              <Ionicons name="camera-outline" size={18} color={BRAND.black} />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickNotePhoto('gallery')}>
              <Ionicons name="image-outline" size={18} color={BRAND.black} />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {notePhotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoPreviewRow}>
              {notePhotos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoPreviewWrap}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhotoAt(index)}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleCreateRide}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={BRAND.black} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={BRAND.black} />
              <Text style={styles.createButtonText}>Create Ride</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={rideDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={rideTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      <Modal visible={showLocationModal} animationType="slide" transparent onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {locationModalType === 'pickup' ? 'Pickup' : 'Drop-off'} Location</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color={BRAND.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={BRAND.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                placeholderTextColor={BRAND.gray}
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredLocations}
              keyExtractor={item => item.id}
              style={styles.locationsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => {
                    if (locationModalType === 'pickup') setPickup(item);
                    else setDropoff(item);
                    setShowLocationModal(false);
                  }}
                >
                  <View style={styles.locationItemIcon}>
                    <Ionicons name="location" size={18} color={BRAND.gray} />
                  </View>
                  <View style={styles.locationItemInfo}>
                    <Text style={styles.locationItemName}>{item.name}</Text>
                    <Text style={styles.locationItemAddress} numberOfLines={1}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BagStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(0, value - 1))}>
        <Ionicons name="remove" size={18} color={BRAND.black} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(5, value + 1))}>
        <Ionicons name="add" size={18} color={BRAND.black} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: BRAND.black },
  headerSpacer: { width: 44 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.black, marginBottom: 12 },
  routeCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  locationInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  locationDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 12, color: BRAND.gray, marginBottom: 2 },
  locationValue: { fontSize: 15, fontWeight: '600', color: BRAND.black },
  locationPlaceholder: { color: BRAND.gray, fontWeight: '400' },
  locationDivider: { height: 1, backgroundColor: BRAND.grayMedium, marginLeft: 36, marginRight: 12 },
  scheduleRow: { flexDirection: 'row', gap: 10 },
  scheduleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  scheduleText: { fontSize: 13, color: BRAND.black, fontWeight: '600' },
  cabTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cabTypeCard: {
    width: (width - 42) / 2,
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    gap: 6,
  },
  cabTypeCardSelected: { borderColor: BRAND.yellow, backgroundColor: BRAND.yellowLight },
  cabTypeName: { fontSize: 14, fontWeight: '600', color: BRAND.black },
  seatsContainer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  seatButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  seatButtonSelected: { backgroundColor: BRAND.yellowLight, borderColor: BRAND.yellow },
  seatButtonText: { fontSize: 14, fontWeight: '600', color: BRAND.black },
  input: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    color: BRAND.black,
    fontSize: 15,
  },
  fareBreakdown: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    borderRadius: 12,
    backgroundColor: BRAND.white,
    overflow: 'hidden',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayLight,
  },
  fareRowHighlight: {
    backgroundColor: BRAND.yellowLight,
    borderBottomWidth: 0,
  },
  fareLabel: {
    fontSize: 13,
    color: BRAND.gray,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 13,
    color: BRAND.black,
    fontWeight: '700',
  },
  fareHighlightLabel: {
    fontSize: 14,
    color: BRAND.black,
    fontWeight: '700',
  },
  fareHighlightValue: {
    fontSize: 16,
    color: BRAND.black,
    fontWeight: '800',
  },
  helperText: { marginTop: 8, fontSize: 13, color: BRAND.gray },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BRAND.white,
  },
  pillActive: { backgroundColor: BRAND.yellowLight, borderColor: BRAND.yellow },
  pillText: { color: BRAND.black, fontWeight: '500' },
  pillTextActive: { fontWeight: '700' },
  bagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    padding: 10,
  },
  bagLabel: { fontSize: 14, fontWeight: '600', color: BRAND.black },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 20, textAlign: 'center', color: BRAND.black, fontWeight: '700' },
  genderContainer: { flexDirection: 'row', gap: 10 },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND.white,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  genderButtonSelected: { backgroundColor: BRAND.yellowLight, borderColor: BRAND.yellow },
  genderButtonText: { fontSize: 13, color: BRAND.black, fontWeight: '600' },
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
  photoButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.yellowLight,
    borderColor: BRAND.yellow,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  photoButtonText: { color: BRAND.black, fontWeight: '600', fontSize: 13 },
  photoPreviewRow: { gap: 10, marginTop: 10 },
  photoPreviewWrap: { position: 'relative' },
  photoPreview: { width: 90, height: 90, borderRadius: 12, backgroundColor: BRAND.grayLight },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#111',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { fontSize: 17, fontWeight: '700', color: BRAND.black },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.78,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: BRAND.black },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.grayLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: BRAND.black },
  locationsList: { maxHeight: height * 0.5 },
  locationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  locationItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationItemInfo: { flex: 1 },
  locationItemName: { fontSize: 15, fontWeight: '600', color: BRAND.black },
  locationItemAddress: { fontSize: 13, color: BRAND.gray, marginTop: 2 },
});
