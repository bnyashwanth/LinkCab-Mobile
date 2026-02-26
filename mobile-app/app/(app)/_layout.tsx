import { Tabs } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors } from "../../constants/theme";
import LinkCabLogo from "../../components/LinkCabLogo";

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60;
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          // Hide the navigator's built-in tab bar; we'll render a custom footer
          tabBarButton: () => null,
          tabBarStyle: { display: 'none', height: 0, position: 'absolute' },
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.gray[400],
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 0,
            paddingVertical: 4,
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
        <Tabs.Screen
          name="create-ride"
          options={{
            title: 'Create',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
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
      </Tabs>
      {/* Custom footer navigation with exactly 5 buttons */}
      <FooterNav insets={insets} />
    </SafeAreaProvider>
  );
}

function FooterNav({ insets }: { insets: { bottom: number } }) {
  const router = useRouter();
  const items = [
    { key: 'home', label: 'Home', icon: 'home-outline', route: '/(app)/home' },
    { key: 'discover', label: 'Discover', icon: 'compass-outline', route: '/(app)/discover' },
    { key: 'create', label: 'Create', icon: 'add-circle-outline', route: '/(app)/create-ride' },
    { key: 'requests', label: 'Requests', icon: 'notifications-outline', route: '/(app)/requests' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', route: '/(app)/profile' },
  ];
  const pathname = usePathname() || '';
  const activeKey = items.find((it) => pathname.includes(it.key))?.key || 'home';

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {items.map((it) => {
        const isActive = it.key === activeKey;
        return (
          <TouchableOpacity key={it.key} style={styles.footerBtn} onPress={() => router.push(it.route)}>
            <Ionicons name={isActive ? it.icon.replace('-outline', '') as any : it.icon as any} size={22} color={isActive ? colors.text.primary : colors.gray[400]} />
            <Text style={[styles.footerLabel, { color: isActive ? colors.text.primary : colors.gray[400] }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 10,
    color: colors.text.primary,
    marginTop: 2,
  },
});
