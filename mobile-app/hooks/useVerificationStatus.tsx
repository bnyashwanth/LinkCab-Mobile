import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useVerification } from "../contexts/VerificationContext";
import { useAuth } from "../contexts/AuthContext";

export interface VerificationCheck {
  isVerified: boolean;
  canProceed: boolean;
  requiresVerification: boolean;
  safetyLevel: 'low' | 'medium' | 'high';
  message: string;
}

export interface UserVerificationInfo {
  userId: string;
  verificationStatus: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  safetyScore: number;
  trustLevel: 'low' | 'medium' | 'high';
  isVerified: boolean;
  verificationDocuments: any;
}

export const useVerificationStatus = () => {
  const { verificationStatus, verificationDocuments, isProfileComplete } = useVerification();
  const { profile } = useAuth();
  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Get current user's verification info
  const getCurrentUserVerification = (): UserVerificationInfo => {
    const safetyScore = calculateSafetyScore(verificationStatus, verificationDocuments);
    
    return {
      userId: profile?.id || '',
      verificationStatus,
      safetyScore,
      trustLevel: getTrustLevel(safetyScore),
      isVerified: verificationStatus === 'verified',
      verificationDocuments,
    };
  };

  // Get another user's verification info
  const getUserVerification = (userProfile: any): UserVerificationInfo => {
    const status = userProfile?.verification_status || 'pending';
    const documents = userProfile?.verification_documents || null;
    const safetyScore = calculateSafetyScore(status, documents);
    
    return {
      userId: userProfile?.id || '',
      verificationStatus: status,
      safetyScore,
      trustLevel: getTrustLevel(safetyScore),
      isVerified: status === 'verified',
      verificationDocuments: documents,
    };
  };

  // Calculate safety score based on verification status and documents
  const calculateSafetyScore = (status: string, documents: any): number => {
    let score = 0;
    
    // Base score for verification status
    switch (status) {
      case 'verified':
        score = 90;
        break;
      case 'under_review':
        score = 60;
        break;
      case 'submitted':
        score = 50;
        break;
      case 'pending':
        score = 20;
        break;
      case 'rejected':
        score = 10;
        break;
      default:
        score = 0;
    }
    
    // Bonus points for completed documents
    if (documents) {
      if (documents.idDocumentUrl) score += 5;
      if (documents.selfieUrl) score += 5;
    }
    
    return Math.min(score, 100);
  };

  // Get trust level based on safety score
  const getTrustLevel = (safetyScore: number): 'low' | 'medium' | 'high' => {
    if (safetyScore >= 80) return 'high';
    if (safetyScore >= 50) return 'medium';
    return 'low';
  };

  // Check if user can perform an action
  const canPerformAction = (action: 'create_ride' | 'request_ride' | 'send_message' | 'connect'): VerificationCheck => {
    const currentVerification = getCurrentUserVerification();
    
    // Different requirements for different actions
    switch (action) {
      case 'create_ride':
        return checkCreateRide(currentVerification);
      case 'request_ride':
        return checkRequestRide(currentVerification);
      case 'send_message':
        return checkSendMessage(currentVerification);
      case 'connect':
        return checkConnect(currentVerification);
      default:
        return {
          isVerified: currentVerification.isVerified,
          canProceed: true,
          requiresVerification: false,
          safetyLevel: 'medium',
          message: 'Action allowed',
        };
    }
  };

  // Check if user can interact with another user
  const canInteractWithUser = (targetUser: UserVerificationInfo, context: 'ride' | 'chat' | 'connection'): VerificationCheck => {
    const currentVerification = getCurrentUserVerification();
    
    // High-risk interactions require verification
    if (context === 'ride' && !targetUser.isVerified) {
      return {
        isVerified: false,
        canProceed: true, // Allow but with warning
        requiresVerification: false,
        safetyLevel: 'low',
        message: 'Target user is not verified. Proceed with caution.',
      };
    }
    
    if (context === 'connection' && !currentVerification.isVerified) {
      return {
        isVerified: false,
        canProceed: true,
        requiresVerification: true,
        safetyLevel: 'medium',
        message: 'Get verified for better connections.',
      };
    }
    
    return {
      isVerified: currentVerification.isVerified,
      canProceed: true,
      requiresVerification: false,
      safetyLevel: 'high',
      message: 'Interaction allowed',
    };
  };

  // Show safety prompt before proceeding
  const showSafetyWarning = (action: () => void, targetUser?: UserVerificationInfo) => {
    setPendingAction(() => action);
    setShowSafetyPrompt(true);
  };

  // Execute pending action
  const executePendingAction = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowSafetyPrompt(false);
  };

  // Cancel pending action
  const cancelPendingAction = () => {
    setPendingAction(null);
    setShowSafetyPrompt(false);
  };

  // Specific action checks
  const checkCreateRide = (verification: UserVerificationInfo): VerificationCheck => {
    if (!verification.isVerified) {
      return {
        isVerified: false,
        canProceed: true,
        requiresVerification: true,
        safetyLevel: 'medium',
        message: 'Get verified to create rides and build trust',
      };
    }
    
    return {
      isVerified: true,
      canProceed: true,
      requiresVerification: false,
      safetyLevel: 'high',
      message: 'Ready to create rides',
    };
  };

  const checkRequestRide = (verification: UserVerificationInfo): VerificationCheck => {
    // Anyone can request rides, but verification helps
    return {
      isVerified: verification.isVerified,
      canProceed: true,
      requiresVerification: false,
      safetyLevel: verification.isVerified ? 'high' : 'medium',
      message: verification.isVerified ? 'Verified rider' : 'Get verified for better matches',
    };
  };

  const checkSendMessage = (verification: UserVerificationInfo): VerificationCheck => {
    // Anyone can send messages
    return {
      isVerified: verification.isVerified,
      canProceed: true,
      requiresVerification: false,
      safetyLevel: 'medium',
      message: 'Messaging enabled',
    };
  };

  const checkConnect = (verification: UserVerificationInfo): VerificationCheck => {
    if (!verification.isVerified) {
      return {
        isVerified: false,
        canProceed: true,
        requiresVerification: true,
        safetyLevel: 'medium',
        message: 'Get verified for better connections',
      };
    }
    
    return {
      isVerified: true,
      canProceed: true,
      requiresVerification: false,
      safetyLevel: 'high',
      message: 'Ready to connect',
    };
  };

  // Get verification requirements for features
  const getFeatureRequirements = (feature: string) => {
    const requirements = {
      create_ride: {
        required: false,
        recommended: true,
        benefits: ['More requests', 'Higher trust', 'Priority matching'],
      },
      request_ride: {
        required: false,
        recommended: true,
        benefits: ['Better matches', 'Verified riders', 'Safer experience'],
      },
      unlimited_connections: {
        required: true,
        recommended: true,
        benefits: ['Unlimited requests', 'Premium features', 'Higher visibility'],
      },
      priority_support: {
        required: true,
        recommended: true,
        benefits: ['24/7 support', 'Issue resolution', 'Priority assistance'],
      },
    };
    
    return requirements[feature as keyof typeof requirements] || {
      required: false,
      recommended: false,
      benefits: [],
    };
  };

  return {
    // Current user verification
    getCurrentUserVerification,
    verificationStatus,
    isProfileComplete,
    safetyScore: calculateSafetyScore(verificationStatus, verificationDocuments),
    
    // User interaction checks
    getUserVerification,
    canPerformAction,
    canInteractWithUser,
    
    // Safety prompt
    showSafetyPrompt,
    showSafetyWarning,
    executePendingAction,
    cancelPendingAction,
    pendingAction,
    
    // Feature requirements
    getFeatureRequirements,
    
    // Utilities
    calculateSafetyScore,
    getTrustLevel,
  };
};
