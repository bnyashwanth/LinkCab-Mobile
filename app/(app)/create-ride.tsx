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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRide } from '@/contexts/RideContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

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

const smokingPreferences = [
  { label: 'No Preference', value: 'any' },
  { label: 'Non-Smoking', value: 'non_smoking' },
  { label: 'Smoking', value: 'smoking' },
];

const petsPreferences = [
  { label: 'No Preference', value: 'any' },
  { label: 'Pets Allowed', value: 'allowed' },
  { label: 'No Pets', value: 'not_allowed' },
];

const vibePreferences = [
  { label: 'No Preference', value: 'any' },
  { label: 'Quiet', value: 'quiet' },
  { label: 'Talking', value: 'talking' },
];

const bookingApps = [
  { label: 'Uber', value: 'Uber' },
  { label: 'Ola', value: 'Ola' },
  { label: 'Rapido', value: 'Rapido' },
  { label: 'Other', value: 'Other' },
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
  const [totalFare, setTotalFare] = useState('');
  const [bookingApp, setBookingApp] = useState('');
  const [customBookingApp, setCustomBookingApp] = useState('');
  const [genderPreference, setGenderPreference] = useState('any');
  const [smokingPreference, setSmokingPreference] = useState('any');
  const [petsPreference, setPetsPreference] = useState('any');
  const [vibePreference, setVibePreference] = useState('any');
  const [notes, setNotes] = useState('');
  const [creatorSmallBags, setCreatorSmallBags] = useState(0);
  const [creatorMediumBags, setCreatorMediumBags] = useState(0);
  const [creatorLargeBags, setCreatorLargeBags] = useState(0);
  const [notePhotoUrls, setNotePhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
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

  const adjustBagCount = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => Math.max(0, prev + delta));
  };

  const uploadRideNotePhoto = async (base64: string, uri: string) => {
    const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${user?.id || 'anonymous'}/rides/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('ride-notes')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('ride-notes')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const processPickedAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets.length) {
      return;
    }
    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const asset of assets.slice(0, Math.max(0, 4 - notePhotoUrls.length))) {
        if (!asset.base64 || !asset.uri) {
          continue;
        }
        const publicUrl = await uploadRideNotePhoto(asset.base64, asset.uri);
        uploadedUrls.push(publicUrl);
      }
      if (uploadedUrls.length > 0) {
        setNotePhotoUrls((prev) => [...prev, ...uploadedUrls].slice(0, 4));
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error?.message || 'Could not upload note photos right now.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const pickNotePhotosFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow gallery access to add note photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 4 - notePhotoUrls.length),
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) {
        return;
      }
      await processPickedAssets(result.assets);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not open gallery.');
    }
  };

  const takeNotePhotoFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to capture note photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) {
        return;
      }
      await processPickedAssets(result.assets);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not open camera.');
    }
  };

  const handleAddNotePhotos = () => {
    Alert.alert('Add Note Photo', 'Choose photo source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: takeNotePhotoFromCamera },
      { text: 'Gallery', onPress: pickNotePhotosFromGallery },
    ]);
  };

  const removeNotePhoto = (url: string) => {
    setNotePhotoUrls((prev) => prev.filter((item) => item !== url));
  };

  const handleCreateRide = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please select both pickup and dropoff locations');
      return;
    }

    if (pickup.id === dropoff.id) {
      Alert.alert('Invalid Route', 'Pickup and dropoff locations cannot be the same');
      return;
    }

    const numericFare = Number(totalFare);
    if (!totalFare || Number.isNaN(numericFare) || numericFare <= 0) {
      Alert.alert('Missing Fare', 'Please enter a valid total fare for the ride');
      return;
    }

    const resolvedBookingApp =
      bookingApp === 'Other' ? customBookingApp.trim() : bookingApp;

    const preferenceLabels: string[] = [];
    if (smokingPreference !== 'any') {
      preferenceLabels.push(smokingPreference === 'non_smoking' ? 'Non-smoking' : 'Smoking');
    }
    if (petsPreference !== 'any') {
      preferenceLabels.push(petsPreference === 'allowed' ? 'Pets allowed' : 'No pets');
    }
    if (vibePreference !== 'any') {
      preferenceLabels.push(vibePreference === 'quiet' ? 'Quiet ride' : 'Talking preferred');
    }
    const preferenceNote =
      preferenceLabels.length > 0 ? `Preferences: ${preferenceLabels.join(', ')}` : '';
    const combinedNotes = [preferenceNote, notes].filter(Boolean).join(' | ');

    setIsSubmitting(true);
    try {
      const createPromise = createRide({
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
        estimated_fare: numericFare,
        booking_app: resolvedBookingApp || undefined,
        gender_preference: genderPreference,
        notes: combinedNotes || undefined,
        note_photo_urls: notePhotoUrls.length ? notePhotoUrls : undefined,
        creator_small_bags: creatorSmallBags,
        creator_medium_bags: creatorMediumBags,
        creator_large_bags: creatorLargeBags,
      });
      const result = await Promise.race([
        createPromise,
        new Promise<{ error: any; data: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), 15000)
        ),
      ]);

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

        {/* Fare Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Fare</Text>
          <TextInput
            style={styles.fareInput}
            placeholder="Enter total ride price (e.g., 800)"
            placeholderTextColor={BRAND.gray}
            value={totalFare}
            onChangeText={setTotalFare}
            keyboardType="numeric"
          />
          <View style={styles.priceCard}>
            <View style={styles.priceInfo}>
              <View style={styles.priceIconContainer}>
                <Ionicons name="pricetag" size={20} color={BRAND.black} />
              </View>
              <View>
                <Text style={styles.priceLabel}>Estimated per person</Text>
                <Text style={styles.priceValue}>
                  ₹{totalFare && !Number.isNaN(Number(totalFare))
                    ? Math.ceil(Number(totalFare) / Math.max(availableSeats, 1))
                    : '--'}
                </Text>
              </View>
            </View>
            <Text style={styles.priceHint}>Based on {availableSeats} seat(s)</Text>
          </View>
        </View>

        {/* Booking App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booked Via (Optional)</Text>
          <View style={styles.bookingAppsRow}>
            {bookingApps.map((app) => (
              <TouchableOpacity
                key={app.value}
                style={[
                  styles.bookingAppButton,
                  bookingApp === app.value && styles.bookingAppButtonSelected,
                ]}
                onPress={() => setBookingApp(app.value)}
              >
                <Text
                  style={[
                    styles.bookingAppButtonText,
                    bookingApp === app.value && styles.bookingAppButtonTextSelected,
                  ]}
                >
                  {app.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {bookingApp === 'Other' && (
            <TextInput
              style={styles.fareInput}
              placeholder="Enter app name"
              placeholderTextColor={BRAND.gray}
              value={customBookingApp}
              onChangeText={setCustomBookingApp}
            />
          )}
        </View>

        {/* Co-passenger Preference Section */}
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

          <Text style={styles.subSectionTitle}>Smoking</Text>
          <View style={styles.preferenceRow}>
            {smokingPreferences.map((pref) => (
              <TouchableOpacity
                key={pref.value}
                style={[
                  styles.preferenceButton,
                  smokingPreference === pref.value && styles.preferenceButtonSelected
                ]}
                onPress={() => setSmokingPreference(pref.value)}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  smokingPreference === pref.value && styles.preferenceButtonTextSelected
                ]}>
                  {pref.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subSectionTitle}>Pets</Text>
          <View style={styles.preferenceRow}>
            {petsPreferences.map((pref) => (
              <TouchableOpacity
                key={pref.value}
                style={[
                  styles.preferenceButton,
                  petsPreference === pref.value && styles.preferenceButtonSelected
                ]}
                onPress={() => setPetsPreference(pref.value)}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  petsPreference === pref.value && styles.preferenceButtonTextSelected
                ]}>
                  {pref.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subSectionTitle}>Ride Vibe</Text>
          <View style={styles.preferenceRow}>
            {vibePreferences.map((pref) => (
              <TouchableOpacity
                key={pref.value}
                style={[
                  styles.preferenceButton,
                  vibePreference === pref.value && styles.preferenceButtonSelected
                ]}
                onPress={() => setVibePreference(pref.value)}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  vibePreference === pref.value && styles.preferenceButtonTextSelected
                ]}>
                  {pref.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Creator Bags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Bags</Text>
          <Text style={styles.sectionSubtitle}>Let riders know your current luggage load</Text>
          <View style={styles.bagCard}>
            {[
              { label: 'Small', icon: 'briefcase-outline', value: creatorSmallBags, setter: setCreatorSmallBags },
              { label: 'Medium', icon: 'bag-handle-outline', value: creatorMediumBags, setter: setCreatorMediumBags },
              { label: 'Large', icon: 'cube-outline', value: creatorLargeBags, setter: setCreatorLargeBags },
            ].map((bag) => (
              <View key={bag.label} style={styles.bagRow}>
                <View style={styles.bagLabelWrap}>
                  <Ionicons name={bag.icon as any} size={18} color={BRAND.black} />
                  <Text style={styles.bagLabel}>{bag.label}</Text>
                </View>
                <View style={styles.bagCounter}>
                  <TouchableOpacity
                    style={styles.bagCounterBtn}
                    onPress={() => adjustBagCount(bag.setter, -1)}
                  >
                    <Ionicons name="remove" size={16} color={BRAND.black} />
                  </TouchableOpacity>
                  <Text style={styles.bagCounterValue}>{bag.value}</Text>
                  <TouchableOpacity
                    style={styles.bagCounterBtn}
                    onPress={() => adjustBagCount(bag.setter, 1)}
                  >
                    <Ionicons name="add" size={16} color={BRAND.black} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddNotePhotos}
              disabled={uploadingPhotos || notePhotoUrls.length >= 4}
            >
              {uploadingPhotos ? (
                <ActivityIndicator size="small" color={BRAND.black} />
              ) : (
                <>
                  <Ionicons name="images-outline" size={16} color={BRAND.black} />
                  <Text style={styles.addPhotoButtonText}>
                    {notePhotoUrls.length > 0 ? `Add More Photos (${notePhotoUrls.length}/4)` : 'Add Note Photos'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {notePhotoUrls.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoPreviewRow}>
              {notePhotoUrls.map((url) => (
                <View key={url} style={styles.photoPreviewItem}>
                  <Image source={{ uri: url }} style={styles.photoPreviewImage} />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removeNotePhoto(url)}>
                    <Ionicons name="close" size={12} color={BRAND.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
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
          style={[styles.createButton, (isSubmitting || uploadingPhotos) && styles.createButtonDisabled]}
          onPress={handleCreateRide}
          disabled={isSubmitting || uploadingPhotos}
          activeOpacity={0.9}
        >
          {isSubmitting || uploadingPhotos ? (
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
  sectionSubtitle: {
    fontSize: 12,
    color: BRAND.gray,
    marginTop: -6,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.black,
    marginTop: 14,
    marginBottom: 8,
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
  priceHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  fareInput: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: BRAND.black,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
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

  preferenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preferenceButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  preferenceButtonSelected: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  preferenceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.gray,
  },
  preferenceButtonTextSelected: {
    color: BRAND.black,
  },

  // Booking App
  bookingAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bookingAppButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
  },
  bookingAppButtonSelected: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  bookingAppButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.gray,
  },
  bookingAppButtonTextSelected: {
    color: BRAND.black,
  },

  // Bags
  bagCard: {
    backgroundColor: BRAND.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BRAND.grayMedium,
    padding: 12,
    gap: 10,
  },
  bagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bagLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
  },
  bagCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bagCounterBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.yellowLight,
    borderWidth: 1,
    borderColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagCounterValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Notes
  photoActions: {
    marginBottom: 10,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.yellowLight,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND.yellow,
  },
  addPhotoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.black,
  },
  photoPreviewRow: {
    gap: 10,
    paddingBottom: 10,
  },
  photoPreviewItem: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
