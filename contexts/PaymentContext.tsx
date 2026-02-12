import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentContextType, Wallet, Transaction } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import * as Sentry from '@sentry/react-native';

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        Sentry.captureException(error);
        return;
      }

      if (data) {
        setWallet(data);
      } else {
        // Create wallet if it doesn't exist
        await createWallet();
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const createWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: 0,
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return;
      }

      setWallet(data);
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const createTransaction = async (
    type: Transaction['type'],
    amount: number,
    rideId?: string,
    description?: string
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount,
          ride_id: rideId,
          description,
          status: 'completed',
        })
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error };
      }

      return { error: null, data };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const updateWalletBalance = async (newBalance: number) => {
    if (!user || !wallet) return { error: new Error('Wallet not found') };

    try {
      const { data, error } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)
        .select()
        .single();

      if (error) {
        Sentry.captureException(error);
        return { error };
      }

      setWallet(data);
      return { error: null };
    } catch (error) {
      Sentry.captureException(error);
      return { error };
    }
  };

  const topUpWallet = async (amount: number): Promise<{ error: any; success: boolean }> => {
    if (!user || !wallet) {
      return { error: new Error('User or wallet not found'), success: false };
    }

    setLoading(true);
    try {
      // Process payment through Razorpay
      const paymentResult = await processPayment('topup', amount, 'INR');
      if (!paymentResult.success) {
        return paymentResult;
      }

      // Create transaction
      const transactionResult = await createTransaction(
        'top_up',
        amount,
        undefined,
        `Wallet top-up of ₹${amount}`
      );

      if (transactionResult.error) {
        return { error: transactionResult.error, success: false };
      }

      // Update wallet balance
      const newBalance = wallet.balance + amount;
      const updateResult = await updateWalletBalance(newBalance);

      if (updateResult.error) {
        return { error: updateResult.error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const deductRequestFee = async (rideId: string): Promise<{ error: any; success: boolean }> => {
    if (!user || !wallet) {
      return { error: new Error('User or wallet not found'), success: false };
    }

    if (wallet.balance < 1) {
      return { error: new Error('Insufficient wallet balance'), success: false };
    }

    setLoading(true);
    try {
      // Create transaction for request fee
      const transactionResult = await createTransaction(
        'request_fee',
        -1,
        rideId,
        'Ride request fee'
      );

      if (transactionResult.error) {
        return { error: transactionResult.error, success: false };
      }

      // Update wallet balance
      const newBalance = wallet.balance - 1;
      const updateResult = await updateWalletBalance(newBalance);

      if (updateResult.error) {
        return { error: updateResult.error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const refundRequestFee = async (rideId: string): Promise<{ error: any; success: boolean }> => {
    if (!user || !wallet) {
      return { error: new Error('User or wallet not found'), success: false };
    }

    setLoading(true);
    try {
      // Create transaction for refund
      const transactionResult = await createTransaction(
        'refund',
        1,
        rideId,
        'Refund for rejected ride request'
      );

      if (transactionResult.error) {
        return { error: transactionResult.error, success: false };
      }

      // Update wallet balance
      const newBalance = wallet.balance + 1;
      const updateResult = await updateWalletBalance(newBalance);

      if (updateResult.error) {
        return { error: updateResult.error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = async (): Promise<{ error: any; data: Transaction[] }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
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

  const getPaymentMethod = (): 'stripe' | 'razorpay' => {
    // For now, default to Razorpay for India
    // In a real app, you'd detect user's country
    return 'razorpay';
  };

  const processPayment = async (
    rideId: string,
    amount: number,
    currency: string
  ): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      const paymentMethod = getPaymentMethod();

      if (paymentMethod === 'razorpay') {
        // Process Razorpay payment
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/razorpay/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            rideId,
            userId: user.id,
          }),
        });

        const orderData = await response.json();

        if (!response.ok) {
          throw new Error(orderData.error || 'Failed to create Razorpay order');
        }

        // Here you would integrate with react-native-razorpay
        // For now, we'll simulate successful payment
        return { error: null, success: true };
      } else {
        // Process Stripe payment
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            rideId,
            userId: user.id,
          }),
        });

        const paymentIntentData = await response.json();

        if (!response.ok) {
          throw new Error(paymentIntentData.error || 'Failed to create Stripe payment intent');
        }

        // Here you would integrate with @stripe/stripe-react-native
        // For now, we'll simulate successful payment
        return { error: null, success: true };
      }
    } catch (error) {
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const addDemoFunds = async (amount: number = 100): Promise<{ error: any; success: boolean }> => {
    if (!user) {
      console.error('Demo funds error: User not authenticated');
      return { error: new Error('User not authenticated'), success: false };
    }

    setLoading(true);
    try {
      console.log('Adding demo funds:', amount, 'for user:', user.id);

      // First, ensure wallet exists
      if (!wallet) {
        console.log('No wallet found, creating new wallet...');
        await createWallet();
        // Wait a bit for wallet to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Create transaction for demo funds
      console.log('Creating transaction...');
      const transactionResult = await createTransaction(
        'top_up',
        amount,
        undefined,
        `Demo wallet top-up of ₹${amount}`
      );

      if (transactionResult.error) {
        console.error('Transaction creation failed:', transactionResult.error);
        return { error: transactionResult.error, success: false };
      }

      // Update wallet balance
      console.log('Updating wallet balance...');
      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + amount;
      const updateResult = await updateWalletBalance(newBalance);

      if (updateResult.error) {
        console.error('Wallet balance update failed:', updateResult.error);
        return { error: updateResult.error, success: false };
      }

      console.log('Demo funds added successfully!');
      return { error: null, success: true };
    } catch (error) {
      console.error('Demo funds exception:', error);
      Sentry.captureException(error);
      return { error, success: false };
    } finally {
      setLoading(false);
    }
  };

  const value: PaymentContextType = {
    loading,
    processPayment,
    getPaymentMethod,
    wallet,
    topUpWallet,
    deductRequestFee,
    refundRequestFee,
    getTransactionHistory,
    addDemoFunds,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};
