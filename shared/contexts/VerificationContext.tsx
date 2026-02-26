import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VerificationStatus, VerificationDocuments, Profile } from '@/types';
import { useAuth } from './AuthContext';
import * as Sentry from '@sentry/react-native';

interface VerificationContextType {
  verificationStatus: VerificationStatus;
  verificationDocuments: VerificationDocuments | null;
  isProfileComplete: boolean;
  loading: boolean;
  uploadDocument: (type: 'id' | 'selfie', file: any, documentType?: string, documentNumber?: string) => Promise<{ error: any; success: boolean }>;
  submitVerification: () => Promise<{ error: any; success: boolean }>;
  checkProfileCompleteness: () => boolean;
  getVerificationSteps: () => { id: string; title: string; completed: boolean; }[];
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

interface VerificationProviderProps {
  children: React.ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocuments | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setVerificationStatus(profile.verification_status || 'pending');
      setVerificationDocuments(profile.verification_documents || null);
    }
  }, [profile]);

  const uploadDocument = async (
    type: 'id' | 'selfie', 
    file: any, 
    documentType?: string, 
    documentNumber?: string
  ) => {
    if (!user) return { error: new Error('User not authenticated'), success: false };

    setLoading(true);
    try {
      // Handle expo-image-picker asset structure
      if (!file || !file.uri) {
        return { error: new Error('Invalid file selected'), success: false };
      }

      // Extract file extension from URI or use mimeType
      const fileExt = file.uri?.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `verification-docs/${user.id}/${fileName}`;

      // Create proper file object for Supabase
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Determine content type from file mimeType or fallback
      const contentType = file.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, blob, {
          contentType: contentType,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Sentry.captureException(uploadError);
        return { error: new Error(`Upload failed: ${uploadError.message}`), success: false };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      // Update verification documents
      const updatedDocs: VerificationDocuments = {
        ...verificationDocuments,
        [type === 'id' ? 'idDocumentUrl' : 'selfieUrl']: publicUrl,
        ...(type === 'id' && { documentType: documentType as any }),
        ...(type === 'id' && { documentNumber }),
        uploadedAt: new Date().toISOString(),
      };

      const { error: updateError } = await updateProfile({
        verification_documents: updatedDocs,
        verification_status: 'submitted'
      });

      if (updateError) {
        console.error('Profile update error:', updateError);
        Sentry.captureException(updateError);
        return { error: new Error(`Profile update failed: ${updateError.message}`), success: false };
      }

      setVerificationDocuments(updatedDocs);
      setVerificationStatus('submitted');

      return { error: null, success: true };
    } catch (error: any) {
      console.error('Upload process error:', error);
      Sentry.captureException(error);
      return { error: new Error(`Upload process failed: ${error?.message || 'Unknown error'}`), success: false };
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async () => {
    if (!user) return { error: new Error('User not authenticated'), success: false };

    setLoading(true);
    try {
      const { error } = await updateProfile({
        verification_status: 'under_review'
      });

      if (error) {
        Sentry.captureException(error);
        return { error, success: false };
      }

      setVerificationStatus('under_review');
      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompleteness = (): boolean => {
    if (!profile) return false;

    const requiredFields = [
      profile.full_name,
      profile.phone_number,
      profile.date_of_birth,
      profile.address,
      verificationDocuments?.idDocumentUrl,
      verificationDocuments?.selfieUrl
    ];

    return requiredFields.every(field => field && field.trim() !== '');
  };

  const getVerificationSteps = () => {
    const steps = [
      { id: 'profile', title: 'Complete Profile', completed: !!profile?.full_name && !!profile?.phone_number },
      { id: 'personal', title: 'Personal Details', completed: !!profile?.date_of_birth && !!profile?.address },
      { id: 'id-doc', title: 'ID Document', completed: !!verificationDocuments?.idDocumentUrl },
      { id: 'selfie', title: 'Selfie Photo', completed: !!verificationDocuments?.selfieUrl },
      { id: 'review', title: 'Under Review', completed: verificationStatus === 'under_review' || verificationStatus === 'verified' },
    ];

    return steps;
  };

  const isProfileComplete = checkProfileCompleteness();

  const value: VerificationContextType = {
    verificationStatus,
    verificationDocuments,
    isProfileComplete,
    loading,
    uploadDocument,
    submitVerification,
    checkProfileCompleteness,
    getVerificationSteps,
  };

  return <VerificationContext.Provider value={value}>{children}</VerificationContext.Provider>;
};
