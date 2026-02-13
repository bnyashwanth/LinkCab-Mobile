import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface FilterOptions {
  dateRange: 'today' | 'week' | 'month' | 'all';
  priceRange: '0-500' | '500-1000' | '1000+' | 'all';
  seatCount: '1' | '2' | '3' | '4+' | 'all';
  rideType: 'sedan' | 'suv' | 'hatchback' | 'all';
}

export default function SearchScreen() {
  const { user } = useAuth();
  const { rides } = useRide();
  const { addNotification } = useNotifications();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRides, setFilteredRides] = useState(rides);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    priceRange: 'all',
    seatCount: 'all',
    rideType: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, rides]);

  const applyFilters = () => {
    let filtered = [...rides];

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(ride => 
        ride.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.dropoff_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.cab_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const rideDate = new Date(ride.ride_date || '');
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(ride => {
            const date = new Date(ride.ride_date || '');
            return date.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(ride => {
            const date = new Date(ride.ride_date || '');
            return date >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(ride => {
            const date = new Date(ride.ride_date || '');
            return date >= monthAgo;
          });
          break;
      }
    }

    // Apply price filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(ride => {
        const fare = ride.fare || 0;
        switch (filters.priceRange) {
          case '0-500':
            return fare >= 0 && fare <= 500;
          case '500-1000':
            return fare > 500 && fare <= 1000;
          case '1000+':
            return fare > 1000;
          default:
            return true;
        }
      });
    }

    // Apply seat count filter
    if (filters.seatCount !== 'all') {
      filtered = filtered.filter(ride => {
        const seats = ride.available_seats || 0;
        switch (filters.seatCount) {
          case '1':
            return seats >= 1;
          case '2':
            return seats >= 2;
          case '3':
            return seats >= 3;
          case '4+':
            return seats >= 4;
          default:
            return true;
        }
      });
    }

    // Apply ride type filter
    if (filters.rideType !== 'all') {
      filtered = filtered.filter(ride => 
        ride.cab_type?.toLowerCase() === filters.rideType
      );
    }

    setFilteredRides(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      priceRange: 'all',
      seatCount: 'all',
      rideType: 'all',
    });
    setSearchQuery('');
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderRide = ({ item }: { item: any }) => {
    const isAvailable = item.status === 'pending' || item.status === 'active';
    
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/(app)/[book-ride]?id=${item.id}`)}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideInfo}>
            <Text style={styles.rideTitle}>
              {item.pickup_address} → {item.dropoff_address}
            </Text>
            <Text style={styles.rideDate}>
              {item.ride_date} at {item.ride_time}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {isAvailable ? 'Available' : 'Booked'}
            </Text>
          </View>
        </View>
        
        <View style={styles.rideDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="car" size={16} color="#666" />
            <Text style={styles.detailText}>{item.cab_type}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.detailText}>{item.available_seats} seats</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Rides</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by location, vehicle type..."
            placeholderTextColor="#999"
          />
        </View>
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters */}
      {(filters.dateRange !== 'all' || filters.priceRange !== 'all' || 
        filters.seatCount !== 'all' || filters.rideType !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.dateRange !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  Date: {filters.dateRange}
                </Text>
                <TouchableOpacity onPress={() => updateFilter('dateRange', 'all')}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {filters.priceRange !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  Price: {filters.priceRange}
                </Text>
                <TouchableOpacity onPress={() => updateFilter('priceRange', 'all')}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {filters.seatCount !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  Seats: {filters.seatCount}
                </Text>
                <TouchableOpacity onPress={() => updateFilter('seatCount', 'all')}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {filters.rideType !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  Type: {filters.rideType}
                </Text>
                <TouchableOpacity onPress={() => updateFilter('rideType', 'all')}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredRides}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        style={styles.ridesList}
        contentContainerStyle={styles.ridesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No rides found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        )}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.filterOptions}>
                {['all', 'today', 'week', 'month'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.dateRange === option && styles.selectedFilter
                    ]}
                    onPress={() => updateFilter('dateRange', option)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.dateRange === option && styles.selectedFilterText
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.filterOptions}>
                {['all', '0-500', '500-1000', '1000+'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.priceRange === option && styles.selectedFilter
                    ]}
                    onPress={() => updateFilter('priceRange', option)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.priceRange === option && styles.selectedFilterText
                    ]}>
                      {option === 'all' ? 'All Prices' : `₹${option}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Seat Count Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Available Seats</Text>
              <View style={styles.filterOptions}>
                {['all', '1', '2', '3', '4+'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.seatCount === option && styles.selectedFilter
                    ]}
                    onPress={() => updateFilter('seatCount', option)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.seatCount === option && styles.selectedFilterText
                    ]}>
                      {option === 'all' ? 'Any' : `${option}+ seats`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ride Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Vehicle Type</Text>
              <View style={styles.filterOptions}>
                {['all', 'sedan', 'suv', 'hatchback'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.rideType === option && styles.selectedFilter
                    ]}
                    onPress={() => updateFilter('rideType', option)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.rideType === option && styles.selectedFilterText
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearButton: {
    padding: 8,
    marginLeft: 12,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.text.primary,
    marginRight: 8,
  },
  clearFiltersButton: {
    padding: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  ridesList: {
    flex: 1,
  },
  ridesContainer: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideInfo: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 14,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  rideDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray[400],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  selectedFilter: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectedFilterText: {
    color: colors.white,
  },
  applyButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
