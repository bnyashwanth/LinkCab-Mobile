import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import * as Sentry from '@sentry/react-native';

interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  created_at: string;
}

interface EmergencyAlert {
  id: string;
  user_id: string;
  type: 'sos' | 'medical' | 'accident' | 'harassment' | 'lost';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  message?: string;
  status: 'active' | 'resolved' | 'cancelled';
  created_at: string;
  resolved_at?: string;
}

interface EmergencyContextType {
  loading: boolean;
  emergencyContacts: EmergencyContact[];
  activeAlerts: EmergencyAlert[];
  addEmergencyContact: (name: string, phone: string, relationship: string, isPrimary?: boolean) => Promise<{ error: any; success: boolean }>;
  updateEmergencyContact: (id: string, updates: Partial<EmergencyContact>) => Promise<{ error: any; success: boolean }>;
  deleteEmergencyContact: (id: string) => Promise<{ error: any; success: boolean }>;
  getEmergencyContacts: () => Promise<{ error: any; data: EmergencyContact[] }>;
  triggerSOS: (location?: { latitude: number; longitude: number; address: string }) => Promise<{ error: any; success: boolean }>;
  triggerEmergencyAlert: (type: EmergencyAlert['type'], location?: { latitude: number; longitude: number; address: string }, message?: string) => Promise<{ error: any; success: boolean }>;
  cancelEmergencyAlert: (alertId: string) => Promise<{ error: any; success: boolean }>;
  getActiveAlerts: () => Promise<{ error: any; data: EmergencyAlert[] }>;
  shareLocationWithContacts: (alertId: string) => Promise<{ error: any; success: boolean }>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

interface EmergencyProviderProps {
  children: React.ReactNode;
}

export const EmergencyProvider: React.FC<EmergencyProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadEmergencyData();
    }
  }, [user]);

  const loadEmergencyData = async () => {
    if (!user) return;
    
    try {
      const [contactsResult, alertsResult] = await Promise.all([
        getEmergencyContacts(),
        getActiveAlerts(),
      ]);

      if (!contactsResult.error && contactsResult.data) {
        setEmergencyContacts(contactsResult.data);
      }
      
      if (!alertsResult.error && alertsResult.data) {
        setActiveAlerts(alertsResult.data);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const addEmergencyContact = async (
    name: string,
    phone: string,
    relationship: string,
    isPrimary: boolean = false
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      // If setting as primary, unset other primary contacts
      if (isPrimary) {
        await supabase
          .from('emergency_contacts')
          .update({ isPrimary: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name,
          phone,
          relationship,
          isPrimary,
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateEmergencyContact = async (
    id: string,
    updates: Partial<EmergencyContact>
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteEmergencyContact = async (id: string): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyContacts = async (): Promise<{ error: any; data: EmergencyContact[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('isPrimary', { ascending: false })
        .order('created_at', { ascending: true });

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

  const triggerSOS = async (
    location?: { latitude: number; longitude: number; address: string }
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: user.id,
          type: 'sos',
          location,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      // Share location with emergency contacts
      if (data && location) {
        await shareLocationWithContacts(data.id);
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const triggerEmergencyAlert = async (
    type: EmergencyAlert['type'],
    location?: { latitude: number; longitude: number; address: string },
    message?: string
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: user.id,
          type,
          location,
          message,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      // Share location with emergency contacts for critical alerts
      if (data && location && (type === 'medical' || type === 'accident')) {
        await shareLocationWithContacts(data.id);
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const cancelEmergencyAlert = async (alertId: string): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({ 
          status: 'cancelled',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      await loadEmergencyData();
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getActiveAlerts = async (): Promise<{ error: any; data: EmergencyAlert[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
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

  const shareLocationWithContacts = async (alertId: string): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    try {
      // In a real implementation, this would:
      // 1. Get the emergency alert details
      // 2. Get user's emergency contacts
      // 3. Send SMS/email notifications to contacts with location
      // 4. Log the sharing activity
      
      const { data: alert } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      const { data: contacts } = await getEmergencyContacts();

      if (alert?.location && contacts && contacts.length > 0) {
        // Mock notification sending
        console.log('Emergency alert shared with contacts:', {
          alertId,
          location: alert.location,
          contacts: contacts.length,
        });
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    }
  };

  const value: EmergencyContextType = {
    loading,
    emergencyContacts,
    activeAlerts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    getEmergencyContacts,
    triggerSOS,
    triggerEmergencyAlert,
    cancelEmergencyAlert,
    getActiveAlerts,
    shareLocationWithContacts,
  };

  return <EmergencyContext.Provider value={value}>{children}</EmergencyContext.Provider>;
};
