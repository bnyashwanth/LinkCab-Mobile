import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContextType, Profile } from '@/types';
import * as Sentry from '@sentry/react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Don't capture Sentry error for missing profile or table - this is normal for new users
        if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
          Sentry.captureException(error);
        }
        return;
      }

      // Map database fields to app fields for compatibility
      const mappedProfile = {
        ...data,
        phone_number: data.phone, // Map phone to phone_number for app usage
      };

      setProfile(mappedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Sentry.captureException(error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber || null,
          },
          // Email verification disabled for testing
          emailRedirectTo: undefined,
        },
      });
      return { error };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error signing out:', error);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
        },
      });
      return { error };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      });
      return { error };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { error: { message: 'User not authenticated' } };

      // Handle field name mapping for database compatibility
      const dbUpdates: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Map phone_number to phone for database compatibility
      if (updates.phone_number) {
        dbUpdates.phone = updates.phone_number;
        delete dbUpdates.phone_number;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...dbUpdates,
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        Sentry.captureException(error);
        return { error };
      }

      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      console.error('Profile update exception:', error);
      Sentry.captureException(error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
