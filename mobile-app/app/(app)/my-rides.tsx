import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRide } from "../../contexts/RideContext";

const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF8DC',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray: '#6B7280',
  grayLight: '#F5F5F5',
  grayMedium: '#E5E7EB',
  green: '#22C55E',
  red: '#EF4444',
};

export default function MyRidesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides: _rides, loading, fetchRides } = useRide();
  const userRides: any[] = []; // hide all rides in My Rides
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return BRAND.yellow;
      case 'accepted':
        return BRAND.green;
      case 'in_progress':
        return BRAND.yellow;
      case 'completed':
        return BRAND.green;
      case 'cancelled':
        return BRAND.red;
      default:
        return BRAND.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const renderRideItem = ({ item }: any) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.rideDate}>
          {new Date(item.ride_date || item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color={BRAND.green} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color={BRAND.red} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        <View style={styles.rideMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="car" size={14} color={BRAND.gray} />
            <Text style={styles.metaText}>
              {item.cab_type || 'Sedan'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={14} color={BRAND.gray} />
            <Text style={styles.metaText}>
              {item.available_seats || 1} seats
            </Text>
          </View>
                  </View>
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              'Cancel Ride',
              'Are you sure you want to cancel this ride?',
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.yellow} />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Rides</Text>
          <Text style={styles.subtitle}>Manage your ride announcements</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.yellow} />
        }
      >
        {userRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car" size={64} color={BRAND.gray} />
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first ride announcement to get started
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(app)/create-ride')}
            >
              <Text style={styles.createButtonText}>Create Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ridesList}>
            {userRides.map((ride) => (
              <View key={ride.id} style={styles.rideItem}>
                {renderRideItem({ item: ride })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: BRAND.gray,
    fontWeight: '500',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 4,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  ridesList: {
    padding: 16,
  },
  rideItem: {
    marginBottom: 16,
  },
  rideCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rideDate: {
    fontSize: 14,
    color: BRAND.gray,
    fontWeight: '500',
  },
  rideDetails: {
    gap: 12,
  },
  routeContainer: {
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: BRAND.black,
    fontWeight: '500',
  },
  routeConnector: {
    width: 2,
    height: 20,
    backgroundColor: BRAND.grayMedium,
    marginHorizontal: 8,
  },
  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: BRAND.gray,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: BRAND.red,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
