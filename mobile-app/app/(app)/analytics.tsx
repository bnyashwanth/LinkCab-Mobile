import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRide } from "../../contexts/RideContext";
import { usePayment } from "../../contexts/PaymentContext";

interface AnalyticsData {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalEarnings: number;
  averageRating: number;
  totalDistance: number;
  thisMonthRides: number;
  thisMonthEarnings: number;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { rides } = useRide();
  const { wallet } = usePayment();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalDistance: 0,
    thisMonthRides: 0,
    thisMonthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    calculateAnalytics();
  }, [rides, wallet]);

  const calculateAnalytics = () => {
    if (!rides || rides.length === 0) {
      setLoading(false);
      return;
    }

    const userRides = rides.filter(ride => ride.rider_id === user?.id);
    const completedRides = userRides.filter(ride => ride.status === 'completed');
    const cancelledRides = userRides.filter(ride => ride.status === 'cancelled');
    
    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const averageRating = completedRides.length > 0 
      ? completedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / completedRides.length 
      : 0;

    // Calculate this month's data
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const thisMonthRides = userRides.filter(ride => {
      const rideDate = new Date(ride.created_at);
      return rideDate.getMonth() === thisMonth && rideDate.getFullYear() === thisYear;
    });

    const thisMonthEarnings = thisMonthRides
      .filter(ride => ride.status === 'completed')
      .reduce((sum, ride) => sum + (ride.fare || 0), 0);

    setAnalytics({
      totalRides: userRides.length,
      completedRides: completedRides.length,
      cancelledRides: cancelledRides.length,
      totalEarnings,
      averageRating,
      totalDistance: completedRides.length * 25, // Estimated
      thisMonthRides: thisMonthRides.length,
      thisMonthEarnings,
    });
    setLoading(false);
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = '#FFD700' 
  }: { 
    icon: string; 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <View style={styles.periodSelector}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period as any)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="car"
              title="Total Rides"
              value={analytics.totalRides}
              subtitle={`${analytics.thisMonthRides} this month`}
              color="#FFD700"
            />
            <StatCard
              icon="checkmark-circle"
              title="Completed"
              value={analytics.completedRides}
              subtitle={`${Math.round((analytics.completedRides / analytics.totalRides) * 100)}% completion rate`}
              color="#22C55E"
            />
            <StatCard
              icon="cash"
              title="Total Earnings"
              value={`₹${analytics.totalEarnings}`}
              subtitle={`₹${analytics.thisMonthEarnings} this month`}
              color="#22C55E"
            />
            <StatCard
              icon="star"
              title="Average Rating"
              value={analytics.averageRating.toFixed(1)}
              subtitle="Out of 5.0"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>Completion Rate</Text>
                <Ionicons name="trending-up" size={16} color="#22C55E" />
              </View>
              <Text style={styles.metricValue}>
                {analytics.totalRides > 0 
                  ? `${Math.round((analytics.completedRides / analytics.totalRides) * 100)}%`
                  : '0%'
                }
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>Cancellation Rate</Text>
                <Ionicons name="trending-down" size={16} color="#EF4444" />
              </View>
              <Text style={styles.metricValue}>
                {analytics.totalRides > 0 
                  ? `${Math.round((analytics.cancelledRides / analytics.totalRides) * 100)}%`
                  : '0%'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="trending-up" size={20} color="#22C55E" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Best Month</Text>
                <Text style={styles.activityValue}>
                  {new Date().toLocaleString('default', { month: 'long' })}
                </Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="cash" size={20} color="#FFD700" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Highest Earning</Text>
                <Text style={styles.activityValue}>₹{analytics.totalEarnings}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wallet Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Balance</Text>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet" size={24} color="#FFD700" />
              <Text style={styles.walletTitle}>Current Balance</Text>
            </View>
            <Text style={styles.walletBalance}>₹{wallet?.balance || 0}</Text>
            <TouchableOpacity 
              style={styles.addMoneyButton}
              onPress={() => router.push('/(app)/wallet')}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFD700',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
  },
  periodButtonTextActive: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF8DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  metricsContainer: {
    gap: 16,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  activityContainer: {
    gap: 12,
  },
  activityItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
