import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verification_status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  phone_number: string | null;
  created_at: string;
}

// Simple cache to avoid duplicate API calls
const profileCache = new Map<string, UserProfile>();

export const useUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    if (profileCache.has(userId)) {
      setProfile(profileCache.get(userId)!);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, verification_status, phone_number, created_at')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile not found, create a default one
            const defaultProfile: UserProfile = {
              id: userId,
              full_name: 'LinkCab User',
              avatar_url: null,
              verification_status: 'pending',
              phone_number: null,
              created_at: new Date().toISOString(),
            };
            setProfile(defaultProfile);
            profileCache.set(userId, defaultProfile);
          } else {
            setError(error.message);
          }
        } else if (data) {
          setProfile(data);
          profileCache.set(userId, data);
        }
      } catch (err) {
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};

// Hook for fetching multiple user profiles at once
export const useMultipleUserProfiles = (userIds: string[]) => {
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userIds.length === 0) {
      setProfiles(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    // Filter out cached profiles
    const uncachedIds = userIds.filter(id => !profileCache.has(id));
    
    if (uncachedIds.length === 0) {
      // All profiles are cached
      const cachedProfiles = new Map<string, UserProfile>();
      userIds.forEach(id => {
        const profile = profileCache.get(id);
        if (profile) cachedProfiles.set(id, profile);
      });
      setProfiles(cachedProfiles);
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, verification_status, phone_number, created_at')
          .in('id', uncachedIds);

        if (error) {
          setError(error.message);
        } else {
          // Update cache and profiles
          const newProfiles = new Map<string, UserProfile>();
          
          // Add cached profiles
          userIds.forEach(id => {
            const cachedProfile = profileCache.get(id);
            if (cachedProfile) {
              newProfiles.set(id, cachedProfile);
            }
          });

          // Add newly fetched profiles
          data?.forEach(profile => {
            newProfiles.set(profile.id, profile);
            profileCache.set(profile.id, profile);
          });

          // Create default profiles for missing users
          userIds.forEach(id => {
            if (!newProfiles.has(id)) {
              const defaultProfile: UserProfile = {
                id,
                full_name: 'LinkCab User',
                avatar_url: null,
                verification_status: 'pending',
                phone_number: null,
                created_at: new Date().toISOString(),
              };
              newProfiles.set(id, defaultProfile);
              profileCache.set(id, defaultProfile);
            }
          });

          setProfiles(newProfiles);
        }
      } catch (err) {
        setError('Failed to fetch user profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [userIds]);

  return { profiles, loading, error };
};

// Utility function to clear cache (useful for logout)
export const clearProfileCache = () => {
  profileCache.clear();
};

// Utility function to get display name with fallbacks
export const getDisplayName = (profile: UserProfile | null, fallbackName?: string) => {
  if (profile?.full_name) return profile.full_name;
  if (fallbackName) return fallbackName;
  return 'LinkCab User';
};

// Utility function to get user initials
export const getUserInitials = (profile: UserProfile | null, fallbackName?: string) => {
  const name = getDisplayName(profile, fallbackName);
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Utility function to check if user is verified
export const isUserVerified = (profile: UserProfile | null) => {
  return profile?.verification_status === 'verified';
};

// Utility function to get user member since text
export const getMemberSinceText = (profile: UserProfile | null) => {
  if (!profile?.created_at) return '';
  return `Member since ${new Date(profile.created_at).getFullYear()}`;
};

// Utility function to get user activity text
export const getActivityText = (profile: UserProfile | null) => {
  if (!profile?.created_at) return '';
  const daysActive = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  return `Active ${daysActive} days`;
};
