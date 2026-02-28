import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { FavoriteRoute } from '../../types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [loading, setLoading] = useState(false);

  const canAdd = useMemo(() => fromCity.trim().length > 1 && toCity.trim().length > 1, [fromCity, toCity]);

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorite_routes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      setFavorites(data as FavoriteRoute[]);
    }
  };

  const addFavorite = async () => {
    if (!user || !canAdd) return;
    setLoading(true);
    const { error } = await supabase.from('favorite_routes').insert({
      user_id: user.id,
      from_city: fromCity.trim(),
      to_city: toCity.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Unable to save favorite route.');
      return;
    }

    setFromCity('');
    setToCity('');
    await loadFavorites();
  };

  const deleteFavorite = async (id: string) => {
    const { error } = await supabase.from('favorite_routes').delete().eq('id', id);
    if (error) {
      Alert.alert('Error', 'Unable to remove favorite route.');
      return;
    }
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Favorite Routes</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          value={fromCity}
          onChangeText={setFromCity}
          placeholder="From city"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          value={toCity}
          onChangeText={setToCity}
          placeholder="To city"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.addButton, (!canAdd || loading) && styles.disabledButton]}
          onPress={addFavorite}
          disabled={!canAdd || loading}
        >
          <Text style={styles.addButtonText}>{loading ? 'Saving...' : 'Save Favorite Route'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.routeTitle}>{item.from_city} to {item.to_city}</Text>
              <Text style={styles.routeDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteFavorite(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={42} color="#9CA3AF" />
            <Text style={styles.emptyText}>No favorite routes yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  placeholder: { width: 36 },
  formCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTextWrap: { flex: 1 },
  routeTitle: { color: '#111827', fontWeight: '700', fontSize: 14 },
  routeDate: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 8, color: '#6B7280' },
});
