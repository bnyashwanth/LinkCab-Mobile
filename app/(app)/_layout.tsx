import { Tabs } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import LinkCabLogo from '@/components/LinkCabLogo';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60;
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.gray[400],
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: colors.brand.secondary,
            paddingBottom: bottomPadding,
            paddingTop: 8,
            height: tabBarHeight + bottomPadding,
            paddingHorizontal: 0,
            marginHorizontal: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
          animation: 'fade',
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create-ride"
          options={{
            title: 'Create',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="payment-methods"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="privacy-security"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="help-support"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="terms"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="verification"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="rate-user"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="safety"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="emergency"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="airport-rides"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="my-rides"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ride-creator-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="destination-detail"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="destination"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="[book-ride]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
