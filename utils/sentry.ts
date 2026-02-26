import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const initSentry = () => {
  if (SENTRY_DSN && !__DEV__) {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: false,
      environment: 'production',
      enableAutoSessionTracking: true,
      // Performance monitoring
      tracesSampleRate: 0.1,
      // Session replay
      _experiments: {
        // The sampling rate for session replay is relative to the tracesSampleRate
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      },
    });
  }
};

export const captureException = (error: any, context?: any) => {
  console.error('Error captured:', error);
  
  if (SENTRY_DSN) {
    if (context) {
      Sentry.captureException(error, {
        extra: context,
      });
    } else {
      Sentry.captureException(error);
    }
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  console.log(`[${level.toUpperCase()}] ${message}`);
  
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

export const setUserContext = (user: any) => {
  if (SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name,
    });
  }
};

export const clearUserContext = () => {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
};
