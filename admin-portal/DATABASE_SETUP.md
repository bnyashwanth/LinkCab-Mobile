# LinkCab Database Setup Guide

This guide will help you set up the LinkCab database schema for the admin portal.

## 🚀 Quick Setup

### 1. Environment Configuration

Make sure your `.env.local` file contains your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema Setup

#### Option A: Automatic Setup (Recommended)

```bash
npm run setup:db
```

#### Option B: Manual Setup

1. Go to your Supabase project
2. Open the **SQL Editor**
3. Copy the entire contents of `scripts/setup-database.sql`
4. Paste and execute the SQL script

### 3. Verify Setup

Run the development server to verify everything works:

```bash
npm run dev
```

## 📋 Database Schema Overview

The setup creates the following tables:

### Core Tables

- **`users`** - User profiles and verification data
- **`announcements`** - Travel announcements/trips
- **`requests`** - Connection requests between users
- **`transactions`** - Financial transactions (₹1 connection fees)

### Safety & Trust Tables

- **`disputes`** - User disputes and resolutions
- **`ratings`** - User ratings and reviews
- **`security_alerts`** - Safety monitoring and alerts
- **`audit_logs`** - System audit trail

### Storage

- **`verification-documents`** - Secure storage for ID documents and selfies

## 🔐 Security Features

The setup includes:

- **Row Level Security (RLS)** policies for data protection
- **Secure file storage** for verification documents
- **Audit logging** for compliance
- **Role-based access control**

## 🛠️ Troubleshooting

### "Could not find the table 'public.users'" Error

This error means the database schema hasn't been set up yet. Run:

```bash
npm run setup:db
```

### Middleware Deprecation Warning

The middleware warning is fixed by removing the deprecated middleware file. The authentication is now handled client-side.

### Permission Errors

Make sure your Supabase project has the correct permissions:

1. Go to Project Settings → API
2. Ensure `anon` and `service_role` keys are enabled
3. Check RLS policies are correctly configured

## 📊 Sample Data (Optional)

The SQL script includes commented sample data for testing. Uncomment the sample data section if you want test data.

## 🔄 Migration Notes

If you're updating an existing database:

1. Backup your current data
2. Run the setup script
3. Restore any custom data
4. Test all features

## 🎯 Next Steps

After database setup:

1. **Start the development server**: `npm run dev`
2. **Login to admin portal** with your credentials
3. **Verify all features** work correctly
4. **Test user verification** flow
5. **Check safety features** and alerts

## 📞 Support

If you encounter issues:

1. Check the Supabase logs
2. Verify environment variables
3. Ensure SQL script executed successfully
4. Check network connectivity to Supabase

## 🚀 Production Deployment

For production:

1. Use environment-specific database
2. Enable all security features
3. Set up proper backup strategies
4. Monitor database performance
5. Regular security audits

---

**Note**: This database schema is designed specifically for LinkCab's safety-first approach to travel sharing.
