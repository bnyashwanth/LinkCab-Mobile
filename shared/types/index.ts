import { User } from '@supabase/supabase-js';

export type VerificationStatus = 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';

export interface VerificationDocuments {
  idDocumentUrl?: string;
  selfieUrl?: string;
  documentType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
  documentNumber?: string;
  uploadedAt?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  verification_status: VerificationStatus;
  verification_documents?: VerificationDocuments;
  date_of_birth: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  pickup_location?: {
    address: string;
  };
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  dropoff_location?: {
    address: string;
  };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'active' | 'booked';
  fare: number;
  estimated_fare?: number;
  currency: string;
  ride_date?: string;
  ride_time?: string;
  available_seats?: number;
  cab_type?: string;
  driver_name?: string;
  gender_preference?: 'male' | 'female' | 'any';
  payment_method: 'stripe' | 'razorpay';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
  user?: {
    name?: string;
    rating?: number;
    verified?: boolean;
  };
}

export interface RideRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requested_at: string;
  responded_at?: string;
  created_at: string;
  passenger?: Profile; // optional joined profile data
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
}

export interface RideContextType {
  currentRide: Ride | null;
  rides: Ride[];
  allRides: Ride[];
  loading: boolean;
  error: string | null;
  createRide: (
    input:
      | { pickup: Location; dropoff: Location }
      | {
        pickup_location: { latitude: number; longitude: number; address: string };
        dropoff_location: { latitude: number; longitude: number; address: string };
        estimated_fare?: number;
        ride_date?: string;
        ride_time?: string;
        available_seats?: number;
        cab_type?: string;
        gender_preference?: string;
        notes?: string;
      }
  ) => Promise<{ error: any; data: Ride | null }>;
  requestRide: (rideId: string) => Promise<{ error: any }>;
  acceptRide: (rideId: string) => Promise<{ error: any }>;
  completeRide: (rideId: string) => Promise<{ error: any }>;
  cancelRide: (rideId: string) => Promise<{ error: any }>;
  rejectRide: (rideId: string) => Promise<void>;
  fetchRides: () => Promise<void>;
  fetchAllRides: () => Promise<void>;
  getRideHistory: () => Promise<{ error: any; data: Ride[] }>;
  // new methods for viewing and responding to requests
  fetchRideRequests: (rideId: string) => Promise<{ error: any; data: RideRequest[] }>;
  respondToRideRequest: (requestId: string, accept: boolean) => Promise<{ error: any; success: boolean }>;

  subscribeToRides: () => () => void;
  deleteAllRides: () => Promise<{ error: any }>;
}

export type TransactionType = 'request_fee' | 'refund' | 'top_up' | 'ride_payment';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'ride_request' | 'ride_accepted' | 'ride_cancelled' | 'ride_completed' | 'payment' | 'safety' | 'general';
  read: boolean;
  created_at: string;
  user_id: string;
  data?: any;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  ride_id?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface PaymentContextType {
  loading: boolean;
  processPayment: (rideId: string, amount: number, currency: string) => Promise<{ error: any; success: boolean }>;
  getPaymentMethod: () => 'stripe' | 'razorpay';
  wallet: Wallet | null;
  topUpWallet: (amount: number) => Promise<{ error: any; success: boolean }>;
  deductRequestFee: (rideId: string) => Promise<{ error: any; success: boolean }>;
  refundRequestFee: (rideId: string) => Promise<{ error: any; success: boolean }>;
  getTransactionHistory: () => Promise<{ error: any; data: Transaction[] }>;
  addDemoFunds: (amount?: number) => Promise<{ error: any; success: boolean }>;
}

export type UserRole = 'rider' | 'driver';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Route {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export interface FareEstimate {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  currency: string;
}
