import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rides: {
        Row: {
          id: string;
          rider_id: string;
          driver_id: string | null;
          pickup_latitude: number;
          pickup_longitude: number;
          pickup_address: string;
          dropoff_latitude: number;
          dropoff_longitude: number;
          dropoff_address: string;
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          fare: number;
          currency: string;
          payment_method: 'stripe' | 'razorpay';
          payment_status: 'pending' | 'paid' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rider_id: string;
          driver_id?: string | null;
          pickup_latitude: number;
          pickup_longitude: number;
          pickup_address: string;
          dropoff_latitude: number;
          dropoff_longitude: number;
          dropoff_address: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          fare: number;
          currency: string;
          payment_method: 'stripe' | 'razorpay';
          payment_status?: 'pending' | 'paid' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rider_id?: string;
          driver_id?: string | null;
          pickup_latitude?: number;
          pickup_longitude?: number;
          pickup_address?: string;
          dropoff_latitude?: number;
          dropoff_longitude?: number;
          dropoff_address?: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          fare?: number;
          currency?: string;
          payment_method?: 'stripe' | 'razorpay';
          payment_status?: 'pending' | 'paid' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
