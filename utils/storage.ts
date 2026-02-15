
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_PREFERENCES: '@user_preferences',
  LOCATION_HISTORY: '@location_history',
  RECENT_ADDRESSES: '@recent_addresses',
} as const;

export const storage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};

export const authStorage = {
  async setToken(token: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async removeToken(): Promise<void> {
    return storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

export const preferencesStorage = {
  async setPreferences(preferences: Record<string, any>): Promise<void> {
    return storage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  async getPreferences(): Promise<Record<string, any> | null> {
    return storage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  },

  async setPreference(key: string, value: any): Promise<void> {
    const preferences = await this.getPreferences() || {};
    preferences[key] = value;
    return this.setPreferences(preferences);
  },

  async getPreference(key: string): Promise<any> {
    const preferences = await this.getPreferences();
    return preferences?.[key] || null;
  },
};

export const locationStorage = {
  async addToHistory(location: { latitude: number; longitude: number; address: string }): Promise<void> {
    const history = await this.getHistory() || [];
    const updatedHistory = [location, ...history.filter((item: any) => 
      item.address !== location.address
    )].slice(0, 10); // Keep only last 10 locations
    return storage.setItem(STORAGE_KEYS.LOCATION_HISTORY, updatedHistory);
  },

  async getHistory(): Promise<Array<{ latitude: number; longitude: number; address: string }> | null> {
    return storage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
  },

  async clearHistory(): Promise<void> {
    return storage.removeItem(STORAGE_KEYS.LOCATION_HISTORY);
  },
};
