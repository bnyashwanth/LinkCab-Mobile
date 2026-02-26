export const APP_CONFIG = {
  name: 'LinkCab.in',
  version: '1.0.0',
} as const;

export const MAP_CONFIG = {
  initialRegion: {
    latitude: 28.6139, // Delhi
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  defaultZoom: 15,
  maxZoom: 20,
  minZoom: 5,
} as const;

export const FARE_CONFIG = {
  baseFare: 50, // INR
  perKmRate: 15, // INR per km
  perMinuteRate: 2, // INR per minute
  currency: 'INR',
  serviceFee: 10, // INR
} as const;

export const PAYMENT_CONFIG = {
  stripe: {
    merchantCountry: 'US',
    currency: 'USD',
  },
  razorpay: {
    merchantCountry: 'IN',
    currency: 'INR',
  },
} as const;

export const RIDE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;

export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
} as const;

export const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
} as const;

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  APPLE: 'apple',
} as const;

export const API_ENDPOINTS = {
  RAZORPAY_CREATE_ORDER: '/api/razorpay/create-order',
  STRIPE_CREATE_PAYMENT_INTENT: '/api/stripe/create-payment-intent',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  LOCATION_ERROR: 'Unable to get your location. Please enable location services.',
  PAYMENT_ERROR: 'Payment failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  RIDE_BOOKED: 'Ride booked successfully!',
  PAYMENT_SUCCESSFUL: 'Payment successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;
