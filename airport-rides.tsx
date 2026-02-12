};

export default function MyRidesScreen() {const DEMO_RIDES = [
  {
    id: '1',
    status: 'pending',
    pickup_address: 'Koramangala 4th Block, Bangalore',
    dropoff_address: 'Bangalore Airport Terminal 1',
    ride_date: '2026-02-10',
    cab_type: 'sedan',
    available_seats: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    status: 'accepted',
    pickup_address: 'Indiranagar 100ft Road',
    dropoff_address: 'Electronic City Phase 1',
    ride_date: '2026-02-11',
    cab_type: 'suv',
    available_seats: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    status: 'in_progress',
    pickup_address: 'MG Road Metro Station',
    dropoff_address: 'Whitefield IT Hub',
    ride_date: '2026-02-09',
    cab_type: 'sedan',
    available_seats: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    status: 'completed',
    pickup_address: 'HSR Layout Sector 1',
    dropoff_address: 'Marathahalli Bridge',
    ride_date: '2026-02-08',
    cab_type: 'hatchback',
    available_seats: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    status: 'completed',
    pickup_address: 'Jayanagar 4th Block',
    dropoff_address: 'Majestic Bus Stand',
    ride_date: '2026-02-07',
    cab_type: 'auto',
    available_seats: 2,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '6',
    status: 'cancelled',
    pickup_address: 'BTM Layout 2nd Stage',
    dropoff_address: 'Silk Board Junction',
    ride_date: '2026-02-06',
    cab_type: 'auto',
    available_seats: 1,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function MyRidesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides: contextRides, loading, cancelRide } = useRide();
  const [activeTab, setActiveTab] = useState('active');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Use demo data if no real rides
  const rides = contextRides.length > 0 ? contextRides : DEMO_RIDES;

  const filteredRides = rides.filter((ride: any) => {
    if (activeTab === 'active')
      return ['pending', 'accepted', 'in_progress'].includes(ride.status);
    if (activeTab === 'completed') return ride.status === 'completed';
    if (activeTab === 'cancelled') return ride.status === 'cancelled';
    return false;
  });

  const handleCancelRide = (rideId: string) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(rideId);
            try {
              await cancelRide(rideId);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: BRAND.yellowLight, color: BRAND.black, icon: 'time-outline', label: 'Pending' };
      case 'accepted':
        return { bg: '#DBEAFE', color: '#1E40AF', icon: 'checkmark-circle-outline', label: 'Accepted' };
      case 'in_progress':
        return { bg: '#D1FAE5', color: '#065F46', icon: 'car-outline', label: 'In Progress' };
      case 'completed':
        return { bg: '#D1FAE5', color: '#065F46', icon: 'checkmark-done-circle-outline', label: 'Completed' };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#991B1B', icon: 'close-circle-outline', label: 'Cancelled' };
      default:
        return { bg: BRAND.grayLight, color: BRAND.gray, icon: 'help-outline', label: status };
    }
  };

  const getCabTypeIcon = (type: string) => {
    switch (type) {
      case 'suv': return 'car-sport-outline';
      case 'sedan': return 'car-outline';
      case 'hatchback': return 'car-outline';
      case 'auto': return 'bicycle-outline';
      default: return 'car-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rides</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/create-ride')}
        >
          <Ionicons name="add" size={24} color={BRAND.black} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'active', label: 'Active', icon: 'car-outline' },
          { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
          { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? BRAND.black : BRAND.gray}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {loading && rides.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator size="large" color={BRAND.yellow} />
            </View>
            <Text style={styles.stateText}>Loading your rides...</Text>
          </View>
        ) : filteredRides.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  activeTab === 'active' ? 'car-outline' :
                    activeTab === 'completed' ? 'checkmark-done-outline' :
                      'close-circle-outline'
                }
                size={48}
                color={BRAND.gray}
              />
            </View>
            <Text style={styles.stateText}>No {activeTab} rides</Text>
            <Text style={styles.stateSubtext}>
              {activeTab === 'active' && 'Create a new ride to get started'}
              {activeTab === 'completed' && 'Your completed rides will appear here'}
              {activeTab === 'cancelled' && 'Cancelled rides will appear here'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={styles.createRideBtn}
                onPress={() => router.push('/(app)/create-ride')}
              >
                <Ionicons name="add-circle" size={20} color={BRAND.black} />
                <Text style={styles.createRideBtnText}>Create a Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ridesList}>
            {filteredRides.map((ride: any) => {
              const statusConfig = getStatusConfig(ride.status);
              const isActive = ['pending', 'accepted', 'in_progress'].includes(ride.status);
              const isCancelling = cancellingId === ride.id;

              return (
                <View key={ride.id} style={styles.rideCard}>
                  {/* Card Header */}
                  <View style={styles.rideHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                    <View style={styles.cabTypeBadge}>
                      <Ionicons name={getCabTypeIcon(ride.cab_type)} size={14} color={BRAND.black} />
                      <Text style={styles.cabTypeText}>
                        {(ride.cab_type || 'sedan').charAt(0).toUpperCase() + (ride.cab_type || 'sedan').slice(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Route */}
                  <View style={styles.routeSection}>
                    <View style={styles.routeMarkers}>
                      <View style={[styles.routeDot, { backgroundColor: BRAND.green }]} />
                      <View style={styles.routeLine} />
                      <View style={[styles.routeDot, { backgroundColor: BRAND.red }]} />
                    </View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {ride.pickup_address || ride.pickup_location?.address || 'Pickup location'}
                      </Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {ride.dropoff_address || ride.dropoff_location?.address || 'Drop-off location'}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detail}>
                      <Ionicons name="calendar-outline" size={16} color={BRAND.gray} />
                      <Text style={styles.detailText}>{ride.ride_date || 'Not set'}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detail}>
                      <Ionicons name="time-outline" size={16} color={BRAND.gray} />
                      <Text style={styles.detailText}>{ride.ride_time || 'Flexible'}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detail}>
                      <Ionicons name="people-outline" size={16} color={BRAND.gray} />
                      <Text style={styles.detailText}>{ride.available_seats ?? 1} seats</Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.fareLabel}>Ride Details</Text>
                    </View>
                    {isActive ? (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.chatBtn}
                          onPress={() => router.push(`/chat/${ride.id}`)}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={20} color={BRAND.black} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelRide(ride.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <ActivityIndicator size="small" color={BRAND.red} />
                          ) : (
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.completedBadge}>
                        <Ionicons
                          name={ride.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={ride.status === 'completed' ? BRAND.green : BRAND.red}
                        />
                        <Text style={[
                          styles.completedText,
                          { color: ride.status === 'completed' ? BRAND.green : BRAND.red }
                        ]}>
                          {ride.status === 'completed' ? 'Done' : 'Cancelled'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: BRAND.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BRAND.grayLight,
    gap: 6,
  },
  activeTab: {
    backgroundColor: BRAND.yellow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.gray,
  },
  activeTabText: {
    color: BRAND.black,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // States
  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateText: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND.black,
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: 14,
    color: BRAND.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  createRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  createRideBtnText: {
    color: BRAND.black,
    fontWeight: '700',
    fontSize: 15,
  },

  // Ride Cards
  ridesList: {
    gap: 14,
  },
  rideCard: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cabTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  cabTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.black,
  },

  // Route
  routeSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeMarkers: {
    alignItems: 'center',
    marginRight: 14,
    paddingVertical: 4,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: BRAND.grayMedium,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 4,
  },

  // Details
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  detail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailDivider: {
    width: 1,
    height: 16,
    backgroundColor: BRAND.grayMedium,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND.gray,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.grayLight,
  },
  fareLabel: {
    fontSize: 12,
    color: BRAND.gray,
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

