# Supabase Configuration Guide

## Current Issue
Email verification redirects to `localhost:3000` instead of Expo app.

## Solution

### 1. Update Supabase Project Settings

#### Authentication → URL Configuration
```
Site URL: exp://10.187.18.36:8082
Redirect URLs: 
- exp://10.187.18.36:8082/**
- https://your-app-domain.com/** (for production)
```

#### Authentication → Email Templates
Update "Confirm signup" template to use correct redirect URL.

### 2. Environment Variables
Your current .env is correctly configured:
```
EXPO_PUBLIC_SUPABASE_URL=https://llfjkxarhberrchfcnra.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RDSdBkJFMqxsPTh4dnFF6g_NfjYD-s9
```

### 3. Alternative: Use Deep Linking
Add to app.json:
```json
{
  "expo": {
    "scheme": "linkcab",
    "android": {
      "package": "com.linkcabin.mobile"
    }
  }
}
```

Then use `linkcab://` in Supabase redirect URLs.
