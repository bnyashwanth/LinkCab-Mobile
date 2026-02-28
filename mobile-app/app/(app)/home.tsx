import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRide } from '../../contexts/RideContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { allRides, fetchAllRides } = useRide();

  useEffect(() => {
    if (user) {
      fetchAllRides();
    }
  }, [user]);

  const name = (profile?.full_name || user?.email?.split('@')[0] || 'User').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCF8" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.brandWrap}>
            <View style={styles.brandBadge}>
              <Ionicons name="car-sport-outline" size={14} color="#1A1A1A" />
            </View>
            <Text style={styles.brandText}>
              <Text style={styles.brandTextDark}>Link</Text>
              <Text style={styles.brandTextGold}>Cab</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/(app)/requests')} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Welcome back, {name}!</Text>
        <Text style={styles.subtitle}>Find your perfect ride</Text>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(app)/discover')} activeOpacity={0.85}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Where do you want to go?</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <ActionCard
            icon="add"
            label="Create Ride"
            onPress={() => router.push('/(app)/create-ride')}
          />
          <ActionCard
            icon="search-outline"
            label="Find Ride"
            onPress={() => router.push('/(app)/discover')}
          />
          <ActionCard
            icon="heart-outline"
            label="Favorites Alerts"
            onPress={() => router.push('/(app)/favorites')}
          />
          <ActionCard
            icon="alert-circle-outline"
            label="Emergency"
            onPress={() => router.push('/(app)/emergency')}
          />
        </View>

        <Text style={styles.sectionTitle}>Available Rides</Text>
        <View style={styles.sectionSpace}>
          {allRides.length === 0 && <Text style={styles.sectionHint}>No rides available right now.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={18} color="#1A1A1A" />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F6CE46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandTextDark: {
    color: '#1A1A1A',
  },
  brandTextGold: {
    color: '#D5A600',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#111111',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    color: '#7B7B7B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4EE',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ECECE3',
    marginBottom: 18,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: '#9AA0A6',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEC',
    minHeight: 156,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6CE46',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: '#171717',
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },
  sectionSpace: {
    minHeight: 120,
    justifyContent: 'center',
  },
  sectionHint: {
    fontSize: 13,
    color: '#8A8A8A',
  },
});
