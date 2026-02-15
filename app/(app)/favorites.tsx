import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FavoriteRoute {
  id: string;
  from_city: string;
  to_city: string;
  created_at: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_routes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setFavorites((data || []) as FavoriteRoute[]);
    } catch {
      // ignore for now
    }
  };

  const handleAdd = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add favorites');
      return;
    }
    if (!fromCity.trim() || !toCity.trim()) {
      Alert.alert('Missing Info', 'Please enter both cities');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('favorite_routes').insert({
        user_id: user.id,
        from_city: fromCity.trim(),
        to_city: toCity.trim(),
      });
      if (error) {
        Alert.alert('Error', error.message || 'Failed to add favorite route');
      } else {
        setFromCity('');
        setToCity('');
        fetchFavorites();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('favorite_routes').delete().eq('id', id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Routes</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>From City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Bangalore"
          value={fromCity}
          onChangeText={setFromCity}
        />
        <Text style={styles.label}>To City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Mysore"
          value={toCity}
          onChangeText={setToCity}
        />
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.text.primary} />
          <Text style={styles.addButtonText}>Add Favorite</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Add routes to get ride alerts</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.favoriteCard}>
            <View>
              <Text style={styles.routeText}>{item.from_city} → {item.to_city}</Text>
              <Text style={styles.routeSubtext}>Alerts when matching rides are created</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger[500]} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  form: {
    backgroundColor: colors.background.primary,
    padding: 20,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 12,
    fontSize: 14,
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary[500],
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  favoriteCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  routeSubtext: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
});
