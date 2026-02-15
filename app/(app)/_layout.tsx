import React from 'react';
import { Tabs } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { NotificationProvider } from '@/contexts/NotificationContext';

// 1. UPDATED THEME COLORS
const THEME = {
  primary: '#FBC02D',   // Yellow (Ride App Style)
  background: '#FFFFFF', 
  inactive: '#9CA3AF',   
  border: '#E5E7EB',     
};

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  
  // Fix for bottom padding on different devices
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 12;
  const tabBarHeight = 60;

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: THEME.primary,
            tabBarInactiveTintColor: THEME.inactive,
            tabBarStyle: {
              backgroundColor: THEME.background,
              borderTopWidth: 1,
              borderTopColor: THEME.border,
              height: tabBarHeight + bottomPadding,
              paddingBottom: bottomPadding,
              paddingTop: 8,
              elevation: 4,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 2,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="discover"
            options={{
              title: 'Discover',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
              ),
            }}
          />
          
          {/* 2. FIXED CREATE RIDE BUTTON (Standard Icon + Label) */}
          <Tabs.Screen
            name="create-ride"
            options={{
              title: 'Create Ride',
              tabBarIcon: ({ color, focused }) => (
                 <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={28} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="announcements"
            options={{
              title: 'Alerts',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              ),
            }}
          />

          {/* 3. HIDDEN SCREENS (Added login-animation here to remove it from bar) */}
          <Tabs.Screen name="login-animation" options={{ href: null }} />
          <Tabs.Screen name="requests" options={{ href: null }} />
          <Tabs.Screen name="edit-profile" options={{ href: null }} />
          <Tabs.Screen name="payment-methods" options={{ href: null }} />
          <Tabs.Screen name="privacy-security" options={{ href: null }} />
          <Tabs.Screen name="help-support" options={{ href: null }} />
          <Tabs.Screen name="terms" options={{ href: null }} />
          <Tabs.Screen name="wallet" options={{ href: null }} />
          <Tabs.Screen name="verification" options={{ href: null }} />
          <Tabs.Screen name="rate-user" options={{ href: null }} />
          <Tabs.Screen name="safety" options={{ href: null }} />
          <Tabs.Screen name="emergency" options={{ href: null }} />
          <Tabs.Screen name="airport-rides" options={{ href: null }} />
          <Tabs.Screen name="my-rides" options={{ href: null }} />
          <Tabs.Screen name="ride-creator-profile" options={{ href: null }} />
          <Tabs.Screen name="chat" options={{ href: null }} />
          <Tabs.Screen name="destination-detail" options={{ href: null }} />
          <Tabs.Screen name="destination" options={{ href: null }} />
          <Tabs.Screen name="favorites" options={{ href: null }} />
          <Tabs.Screen name="announcement-details" options={{ href: null }} />
          <Tabs.Screen name="[book-ride]" options={{ href: null }} />
          <Tabs.Screen name="live-tracking" options={{ href: null }} />
          <Tabs.Screen name="search" options={{ href: null }} />
          <Tabs.Screen name="analytics" options={{ href: null }} />
        </Tabs>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}