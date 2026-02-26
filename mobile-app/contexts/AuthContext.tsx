import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "../lib/supabase";
import { AuthContextType, Profile } from '@/types';
import * as Sentry from '@sentry/react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

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
        // missing row is expected for new users; create default profile instead
        if (error.code === 'PGRST116') {
          console.warn('No profile found for user, creating blank record:', userId);
          try {
            const { data: newProfile, error: insertErr } = await supabase
              .from('profiles')
              .insert({ id: userId })
              .select()
              .single();
            if (insertErr) {
              console.error('Failed to create empty profile:', insertErr);
              Sentry.captureException(insertErr);
            } else {
              setProfile({ ...newProfile, phone_number: newProfile.phone });
            }
          } catch (insertCatch) {
            console.error('Unexpected error inserting profile:', insertCatch);
            Sentry.captureException(insertCatch);
          }
          return;
        }
        console.error('Error fetching profile:', error);
        // Don't capture Sentry error for missing profile or table - this is normal for new users
        if (error.code !== 'PGRST205') {
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

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
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
      console.log(`Starting ${provider} OAuth sign in...`);
      
      let redirectUri = AuthSession.makeRedirectUri({
        scheme: 'linkcab',
        preferLocalhost: false,
      });

      // Fallback for development if the above doesn't work
      if (!redirectUri || redirectUri.includes('exp://')) {
        redirectUri = 'linkcab://auth-callback';
      }

      console.log(`Redirect URI: ${redirectUri}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error(`${provider} OAuth initialization error:`, error);
        throw error;
      }

      console.log(`Opening ${provider} OAuth session...`);
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (res.type === 'success' && res.url) {
        console.log(`${provider} OAuth successful, processing callback...`);
        
        // Let Supabase handle the session automatically from the URL
        // The deep linking will trigger the auth callback which will handle the session
        console.log(`${provider} OAuth completed, waiting for session...`);
        return { error: null };
      } else if (res.type === 'cancel') {
        console.log(`${provider} OAuth cancelled by user`);
        return { error: { message: `${provider} login was cancelled` } };
      } else {
        console.error(`${provider} OAuth failed with type:`, res.type);
        return { error: { message: `${provider} login failed: ${res.type}` } };
      }
    } catch (error) {
      console.error(`${provider} OAuth exception:`, error);
      Sentry.captureException(error);
      return { error: error as any };
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
