import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import * as Sentry from '@sentry/react-native';

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  ride_id?: string;
  type: 'inappropriate_behavior' | 'safety_concern' | 'fraud' | 'harassment' | 'other';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

interface SafetyAlert {
  id: string;
  type: 'warning' | 'suspicious_activity' | 'blocked_user' | 'community_guideline';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  created_at: string;
  expires_at?: string;
}

interface SafetyStats {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  userTrustScore: number;
  safetyLevel: 'excellent' | 'good' | 'moderate' | 'needs_attention';
}

interface SafetyContextType {
  loading: boolean;
  safetyStats: SafetyStats | null;
  activeAlerts: SafetyAlert[];
  submitReport: (reportedId: string, type: Report['type'], description: string, rideId?: string) => Promise<{ error: any; success: boolean }>;
  getUserReports: (userId: string) => Promise<{ error: any; data: Report[] }>;
  getSafetyStats: (userId: string) => Promise<{ error: any; data: SafetyStats }>;
  getActiveAlerts: () => Promise<{ error: any; data: SafetyAlert[] }>;
  blockUser: (userId: string) => Promise<{ error: any; success: boolean }>;
  unblockUser: (userId: string) => Promise<{ error: any; success: boolean }>;
  getBlockedUsers: () => Promise<{ error: any; data: string[] }>;
  checkUserSafety: (userId: string) => Promise<{ isBlocked: boolean; hasReports: boolean; trustScore: number }>;
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (context === undefined) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};

interface SafetyProviderProps {
  children: React.ReactNode;
}

export const SafetyProvider: React.FC<SafetyProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [safetyStats, setSafetyStats] = useState<SafetyStats | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SafetyAlert[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSafetyData();
    }
  }, [user]);

  const loadSafetyData = async () => {
    if (!user) return;
    
    try {
      const [statsResult, alertsResult] = await Promise.all([
        getSafetyStats(user.id),
        getActiveAlerts(),
      ]);

      if (!statsResult.error && statsResult.data) {
        setSafetyStats(statsResult.data);
      }
      
      if (!alertsResult.error && alertsResult.data) {
        setActiveAlerts(alertsResult.data);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const submitReport = async (
    reportedId: string,
    type: Report['type'],
    description: string,
    rideId?: string
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    if (user.id === reportedId) {
      return { error: new Error('Cannot report yourself'), success: false };
    }

    setLoading(true);
    try {
      // Check if user has already reported this person for this ride
      if (rideId) {
        const { data: existingReport } = await supabase
          .from('reports')
          .select('*')
          .eq('reporter_id', user.id)
          .eq('reported_id', reportedId)
          .eq('ride_id', rideId)
          .single();

        if (existingReport) {
          return { error: new Error('You have already reported this user for this ride'), success: false };
        }
      }

      // Submit the report
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: reportedId,
          ride_id: rideId,
          type,
          description,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      // Create safety alert for critical reports
      if (type === 'safety_concern' || type === 'harassment') {
        await createSafetyAlert({
          type: 'community_guideline',
          message: `New ${type} report submitted for review`,
          severity: 'high',
          user_id: reportedId,
        });
      }

      // Refresh safety stats
      await loadSafetyData();

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getUserReports = async (userId: string): Promise<{ error: any; data: Report[] }> => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: [] };
    }
  };

  const getSafetyStats = async (userId: string): Promise<{ error: any; data: SafetyStats }> => {
    try {
      // Get reports made by user
      const { data: madeReports, error: madeError } = await supabase
        .from('reports')
        .select('status')
        .eq('reporter_id', userId);

      // Get reports against user
      const { data: receivedReports, error: receivedError } = await supabase
        .from('reports')
        .select('status, type')
        .eq('reported_id', userId);

      if (madeError || receivedError) {
        Sentry.captureException(madeError || receivedError);
        return { error: madeError || receivedError, data: { totalReports: 0, resolvedReports: 0, pendingReports: 0, userTrustScore: 100, safetyLevel: 'excellent' } };
      }

      const totalReports = madeReports?.length || 0;
      const resolvedReports = madeReports?.filter(r => r.status === 'resolved').length || 0;
      const pendingReports = madeReports?.filter(r => r.status === 'pending').length || 0;
      
      // Calculate trust score based on received reports
      const criticalReports = receivedReports?.filter(r => 
        r.type === 'safety_concern' || r.type === 'harassment'
      ).length || 0;
      
      let userTrustScore = 100;
      if (criticalReports > 0) {
        userTrustScore = Math.max(0, 100 - (criticalReports * 25));
      }

      // Determine safety level
      let safetyLevel: SafetyStats['safetyLevel'] = 'excellent';
      if (userTrustScore < 25) safetyLevel = 'needs_attention';
      else if (userTrustScore < 50) safetyLevel = 'moderate';
      else if (userTrustScore < 75) safetyLevel = 'good';

      return {
        error: null,
        data: {
          totalReports,
          resolvedReports,
          pendingReports,
          userTrustScore,
          safetyLevel,
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: { totalReports: 0, resolvedReports: 0, pendingReports: 0, userTrustScore: 100, safetyLevel: 'excellent' } };
    }
  };

  const getActiveAlerts = async (): Promise<{ error: any; data: SafetyAlert[] }> => {
    try {
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.now()`)
        .order('created_at', { ascending: false });

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      return { error: null, data: data || [] };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: [] };
    }
  };

  const createSafetyAlert = async (alert: Omit<SafetyAlert, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString(),
        });

      if (error) {
        Sentry.captureException(error);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const blockUser = async (userId: string): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    if (user.id === userId) {
      return { error: new Error('Cannot block yourself'), success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          created_at: new Date().toISOString(),
        });

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getBlockedUsers = async (): Promise<{ error: any; data: string[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) {
        Sentry.captureException(error);
        return { error, data: [] };
      }

      const blockedIds = data?.map(item => item.blocked_id) || [];
      return { error: null, data: blockedIds };
    } catch (error) {
      Sentry.captureException(error);
      return { error, data: [] };
    }
  };

  const checkUserSafety = async (userId: string): Promise<{ isBlocked: boolean; hasReports: boolean; trustScore: number }> => {
    try {
      // Check if user is blocked
      const { data: blockedCheck } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user?.id || '')
        .eq('blocked_id', userId)
        .single();

      const isBlocked = !!blockedCheck;

      // Get safety stats for trust score
      const { data: stats } = await getSafetyStats(userId);
      const trustScore = stats?.userTrustScore || 100;

      // Check for reports
      const { data: reports } = await getUserReports(userId);
      const hasReports = (reports?.length || 0) > 0;

      return { isBlocked, hasReports, trustScore };
    } catch (error) {
      Sentry.captureException(error);
      return { isBlocked: false, hasReports: false, trustScore: 100 };
    }
  };

  const value: SafetyContextType = {
    loading,
    safetyStats,
    activeAlerts,
    submitReport,
    getUserReports,
    getSafetyStats,
    getActiveAlerts,
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkUserSafety,
  };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
};
