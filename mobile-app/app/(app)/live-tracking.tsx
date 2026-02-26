import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const { width, height } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface RideData {
  id: string;
  status: string;
  pickup_location: Location;
  dropoff_location: Location;
  current_location?: Location;
  driver_location?: Location;
  estimated_arrival?: string;
}

export default function LiveTrackingScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [ride, setRide] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchRideDetails();
    subscribeToLocationUpdates();
    
    return () => {
      // Cleanup subscriptions
    };
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) throw error;
      
      if (data) {
        setRide(data);
        setRouteCoordinates([
          data.pickup_location,
          data.dropoff_location
        ]);
        setTracking(data.status === 'in_progress');
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Could not load ride details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLocationUpdates = () => {
    // Subscribe to real-time location updates
    const subscription = supabase
      .channel(`ride-tracking:${id}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'rides',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new) {
            const updatedRide = payload.new as RideData;
            setRide(updatedRide);
            
            if (updatedRide.current_location) {
              setRouteCoordinates(prev => {
                const newPrev = prev.slice(0, -1);
                return newPrev.length > 0 ? [...newPrev, updatedRide.current_location] : [updatedRide.current_location];
              });
            }
            
            // Center map on current location
            if (mapRef.current && updatedRide.current_location) {
              mapRef.current.animateToRegion({
                latitude: updatedRide.current_location.latitude,
                longitude: updatedRide.current_location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
            }
          }
        }
      )
      .subscribe();
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Contact',
      'Do you want to call emergency services?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Emergency call initiated') }
      ]
    );
  };

  const handleShareLocation = () => {
    if (ride?.current_location) {
      Alert.alert(
        'Share Location',
        `Current location: ${ride.current_location.latitude}, ${ride.current_location.longitude}`,
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride tracking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Ride not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => useRouter().back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: tracking ? '#22C55E' : '#F59E0B' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: tracking ? '#22C55E' : '#F59E0B' }
            ]} />
            <Text style={styles.statusText}>
              {tracking ? 'Active' : 'Waiting'}
            </Text>
          </View>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: ride.pickup_location.latitude,
          longitude: ride.pickup_location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FFD700"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Pickup marker */}
        <Marker
          coordinate={ride.pickup_location}
          title="Pickup Location"
          pinColor="#22C55E"
        />

        {/* Dropoff marker */}
        <Marker
          coordinate={ride.dropoff_location}
          title="Dropoff Location"
          pinColor="#EF4444"
        />

        {/* Current location marker */}
        {ride.current_location && (
          <Marker
            coordinate={ride.current_location}
            title="Current Location"
            pinColor="#FFD700"
          />
        )}

        {/* Driver location marker */}
        {ride.driver_location && (
          <Marker
            coordinate={ride.driver_location}
            title="Driver"
            pinColor="#1A1A1A"
          />
        )}
      </MapView>

      <View style={styles.bottomPanel}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.infoValue}>
                {ride.estimated_arrival || 'Calculating...'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="speedometer" size={20} color="#666" />
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={styles.infoValue}>-- km/h</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="navigate" size={20} color="#666" />
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>-- km</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {tracking ? 'On Route' : 'Waiting'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareLocation}
          >
            <Ionicons name="share" size={20} color="#1A1A1A" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={handleEmergencyCall}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
