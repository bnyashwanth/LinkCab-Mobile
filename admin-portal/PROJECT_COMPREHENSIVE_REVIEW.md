# LinkCab: Comprehensive Project Architecture & Integration Guide

Welcome to the complete overview of the **LinkCab** project! This document explains how the entire ecosystem—the Mobile App, the Admin Portal, and the Supabase Backend—works together. It also outlines essential enhancements necessary for production stability.

---

## 🏗️ 1. Project Ecosystem Overview

LinkCab is a decentralized ride-sharing platform connecting drivers with open seats to passengers seeking a route. The stack is split into three core zones:

1. **The Client (Frontend):** A React Native mobile app built with Expo.
2. **The Command Center (Admin):** A Next.js web application for moderation and statistics.
3. **The Backend & Database (BaaS):** A Supabase project handling Authentication, PostgreSQL data, and object storage.

---

## 📱 2. The Mobile App (React Native / Expo)

_Located in the `mobile-app` directory._

The app serves both passengers and drivers. It uses Expo Router for navigation, allowing a directory-based file structure.

### Key Technologies

- **Expo & React Native:** Compiles native code for iOS & Android.
- **Expo Router:** Handles navigating between pages (e.g., `/discover`, `/create-ride`).
- **Context API:** Handles global state (`AuthContext`, `RideContext`, `VerificationContext`, `PaymentContext`).

### Core Workflows

1. **Authentication (`/app/(auth)`):**
   - Users sign up using Supabase Auth (`email` & `password`).
   - The UI pushes details to Supabase. Supabase handles the session natively over secure tokens.
2. **Ride Creation & Discovery (`/app/(app)/create-ride.tsx`):**
   - Drivers input their destination, price, and seats.
   - Upon submission, it creates a row in the `announcements` database table.
3. **Ride Requests (`/app/(app)/discover.tsx`):**
   - Passengers find open `announcements`. They send a request, creating a row in the `requests` table.
   - This deducts a `request_fee` transaction from their wallet (`PaymentContext.tsx`).
4. **eKYC Document Upload (`/app/(app)/verification.tsx`):**
   - Users upload sensitive documents (Aadhaar, selfie) to the Supabase `verification-documents` storage bucket.
   - `AuthContext` updates the user's `kyc_status` to `submitted`.

---

## 💻 3. The Admin Portal (Next.js)

_Located in the `admin-portal` directory._

The admin portal is a web tool used by LinkCab staff to monitor health, users, rides, and approve KYC documents.

### Key Technologies

- **Next.js (App Router):** Fast, React-based web framework.
- **Tailwind CSS & shadcn/ui:** Styling and component logic (Radix primitives).
- **Supabase Server Client (`@supabase/ssr`):** Connects to the database using elevated Admin API keys (Bypassing normal Row Level Security limitations).

### Core Workflows

1. **Dashboard (`src/app/page.tsx`):**
   - A secure root page wrapped by `<ProtectedRoute>`. It queries aggregate statistics directly from the database (e.g., "Total Users," "Total Revenue").
2. **KYC Moderation (`src/app/kyc/verification/page.tsx`):**
   - Pulls users where `kyc_status` is `submitted` or `under_review`.
   - The admin UI fetches the uploaded images using public URLs from the bucket and allows staff to trigger the database state to `verified` or `rejected`.
3. **Database Health Logic (`src/lib/database.ts`):**
   - Implements `checkDatabaseHealth()`, an API fetch wrapper that automatically shuts off database-heavy components if the Supabase instance becomes unreachable.

---

## 🗄️ 4. The Backend Database (Supabase PostgreSQL)

_Configured via `DATABASE_OVERVIEW.md` and SQL scripts in `admin-portal/database-scripts`._

Supabase is the heart of LinkCab. It stores data across interconnected PostgreSQL tables using relational foreign keys.

### The Interconnection (How the data flows):

1. Upon a user downloading the App and signing up, Supabase writes them to `auth.users`.
2. A PostgreSQL **Trigger** (`on_auth_user_created`) immediately detects this, firing a script that clones that user into the public `users` table.
3. Another Trigger (`create_wallet_for_new_user`) then detects the new `users` row and creates their associated bank in the `wallets` table simultaneously.

### The Financial Syncing (Payment Context ↔ Postgres)

Payments use a dual-layer approach:

1. When the mobile app does a "Top Up", it interfaces via a Razorpay/Stripe API.
2. Upon success, the `PaymentContext.tsx` writes a `transaction` row with type `wallet_credit` to the database.
3. It natively updates the `wallets` table `balance` and updates `last_updated`. _Note: Both must succeed for the client to reflect accurate funds._

---

## 🚀 5. Crucial Architectural Enhancements Needed

While the core functionality of LinkCab is implemented, moving this codebase into a production environment requires several immediate upgrades:

### Essential Enhancement 1: Row Level Security (RLS)

- **Current State:** The PostgreSQL database allows anyone with the Supabase API URL and Anon Key to directly query or write to _any_ table (if they know how).
- **Required Action:** Active RLS policies must be applied mapping against `auth.uid()`.
  - _Example:_ "Users can only select rows from `wallets` where their `user_id` matches their auth ID."
  - _Example:_ "Only users can UPDATE their own `requests`."

### Essential Enhancement 2: Server-Side Transactions (RPC)

- **Current State:** Financial movement (like top-ups or request refunds) happen from the React Native UI (`mobile-app/contexts/PaymentContext.tsx`). If the mobile app loses internet connection halfway through a multi-step update, funds can be permanently lost or duplicated.
- **Required Action:** Migrate dual-writes into **PostgreSQL Atomic Transactions** (RPC). The frontend should call _one_ Supabase function (`transfer_funds`) that locks rows, adjusts both balances, and creates the ledger log entirely on the backend server.

### Essential Enhancement 3: Environment Variable Security

- **Current State:** The Mobile App natively references `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Required Action:** Secret processing (Stripe / Razorpay logic) should be migrated strictly to Supabase Edge Functions. The Mobile App shouldn't directly push HTTP requests to payment processors; it should ask the Edge Function to handle verification.

### Essential Enhancement 4: Push Notifications & Websockets

- **Current State:** Data fetching (like checking if a ride request was accepted) is primarily manual (poll/refresh).
- **Required Action:** Implement Supabase Realtime subscriptions in `RideContext.tsx` so users receive immediate push updates when an `appointment` state changes from `pending` to `accepted`.
