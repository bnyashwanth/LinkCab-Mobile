# Database Scripts

This folder contains all SQL database setup scripts for the LinkCab admin portal.

## 📁 Files:

### **Recommended Scripts:**

1. **`simple-database-setup.sql`** ⭐ **RECOMMENDED**
   - Clean setup without RLS policies (avoids auth.uid() errors)
   - Creates all essential tables with indexes and triggers
   - Best for initial setup

## 🚀 Quick Start:

1. **Use `simple-database-setup.sql`** for initial setup
2. **Run in Supabase SQL Editor**
3. **Create admin user** in Supabase Auth
4. **Test admin portal login**

## 📋 Setup Steps:

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from your chosen SQL file
3. Paste and run the queries
4. Create admin user in Authentication → Users
5. Update user record to make them admin

## 🔐 Admin Credentials:

- **Email**: `bnyashwanth2006@gmail.com`
- **Password**: `asdfghjkl;'`

## ⚠️ Notes:

- Start with `simple-database-setup.sql` to avoid errors
- Only use other files if you need specific features
- Delete old SQL files from root directory
