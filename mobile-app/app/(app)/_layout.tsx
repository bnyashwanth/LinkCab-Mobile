import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: '#D4A300',
        tabBarInactiveTintColor: '#7A808A',
        sceneStyle: {
          backgroundColor: colors.background.primary,
        },
       tabBarStyle: {
  position: 'absolute',
  bottom: 16,

  marginHorizontal: 20,   // 👈 THIS is the key fix

  backgroundColor: '#FFFFFF',
  borderTopColor: '#E9E9E0',
  borderTopWidth: 1,

  height: 64,
  paddingTop: 6,
  paddingBottom: 8,

  borderRadius: 32,

  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
},
        tabBarItemStyle: {
          paddingVertical: 2,
          borderRadius: 12,
          marginHorizontal: 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveBackgroundColor: '#FFFFFF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: ({ children }) => (
            <Text style={{ color: '#7A808A', fontSize: 11, fontWeight: '700' }}>{children}</Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarLabel: ({ children }) => (
            <Text style={{ color: '#7A808A', fontSize: 11, fontWeight: '700' }}>{children}</Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Alerts',
          tabBarLabel: ({ children }) => (
            <Text style={{ color: '#7A808A', fontSize: 11, fontWeight: '700' }}>{children}</Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ children }) => (
            <Text style={{ color: '#7A808A', fontSize: 11, fontWeight: '700' }}>{children}</Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="create-ride" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="airport-rides" options={{ href: null }} />
      <Tabs.Screen name="announcement-details" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="destination" options={{ href: null }} />
      <Tabs.Screen name="destination-detail" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="emergency" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="live-tracking" options={{ href: null }} />
      <Tabs.Screen name="my-rides" options={{ href: null }} />
      <Tabs.Screen name="my-requests" options={{ href: null }} />
      <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="privacy-security" options={{ href: null }} />
      <Tabs.Screen name="rate-user" options={{ href: null }} />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen name="ride-creator-profile" options={{ href: null }} />
      <Tabs.Screen name="safety" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="[book-ride]" options={{ href: null }} />
    </Tabs>
  );
}
