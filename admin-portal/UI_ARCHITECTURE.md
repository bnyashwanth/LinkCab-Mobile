# LinkCab UI Architecture Guide

This guide maps out the User Interface (UI) of the LinkCab project. If you want to modify how a specific page, screen, or component looks, this document tells you exactly which file to edit.

---

## 📱 Mobile App (React Native / Expo)

**Location:** `/mobile-app`

The mobile app relies heavily on the design tokens and colors defined globally. If you want to change colors, fonts, spacing, or shadows globally, edit **`mobile-app/constants/theme.ts`**.

### 1. Navigation & Layout

- **Bottom Navigation Bar:** `app/(app)/_layout.tsx` _(Contains the `FooterNav` component)_
- **Authentication Flow Layout:** `app/(auth)/_layout.tsx`

### 2. Authentication Screens

- **Login Screen:** `app/(auth)/login.tsx`
- **Sign Up / Registration:** `app/(auth)/signup.tsx`
- **Forgot Password:** `app/(auth)/forgot-password.tsx`

### 3. Main Application Screens (`app/(app)/`)

- **Home / Dashboard:** `home.tsx` _(Main landing screen after login)_
- **Discover / Find Rides:** `discover.tsx`
- **Create / Offer a Ride:** `create-ride.tsx`
- **Ride Requests / Notifications:** `requests.tsx`
- **User Profile:** `profile.tsx`
- **Edit Profile:** `edit-profile.tsx` _(Name, Avatar, Phone)_
- **Wallet & Transactions:** `wallet.tsx` _(Balance, Top-up UI, Transaction History)_
- **KYC Document Upload:** `verification.tsx` _(Aadhaar, Selfie upload)_

### 4. Reusable UI Components

If you want to change a button or input style that appears across _multiple_ screens, edit these:

- **Buttons:** `components/Button.tsx`
- **Text Inputs:** `components/Input.tsx`
- **Ride Cards (Listings):** `components/RideCard.tsx` / `components/OptimizedRideCard.tsx`
- **Destination Input:** `components/DestinationInput.tsx`
- **Logo Display:** `components/LinkCabLogo.tsx`

---

## 💻 Admin Portal (Next.js / React)

**Location:** `/admin-portal`

The Admin Portal is built with Next.js and Tailwind CSS. The global styles are located in **`src/app/globals.css`**.

### 1. Navigation & Layout

- **Sidebar Menu:** `src/components/admin-sidebar.tsx` _(Change links, icons, or sidebar colors here)_
- **Top Header:** `src/components/header.tsx`
- **Main Shell (Auth wrapped):** `src/components/auth-layout.tsx`

### 2. Dashboard & Core Pages

- **Main Dashboard (Stats & Charts):** `src/app/page.tsx`
- **Admin Login Page:** `src/app/login/page.tsx`
- **Settings:** `src/app/settings/page.tsx`

### 3. Management Dashboards

If you need to change the tables, lists, or action buttons for specific admin management areas:

- **User Management:** `src/app/users/page.tsx`
- **KYC / Verification Approvals:** `src/app/kyc/verification/page.tsx`
- **Ride Announcements:** `src/app/announcements/page.tsx`
- **Ride Requests:** `src/app/requests/page.tsx`

### 4. Reusable UI Components

The admin portal uses modular Tailwind components (often based on shadcn/ui). These are located in **`src/components/ui/`**:

- **Badges:** `badge.tsx`
- **Buttons:** `button.tsx`
- **Cards (Containers):** `card.tsx`
- **Tables:** `table.tsx`
- **Inputs:** `input.tsx`

---

## 🎨 General Styling Tips

- **Mobile:** All mobile app screens use `StyleSheet.create({})` at the bottom of their respective files for specific UI tweaks. For colors, they import `colors` from `constants/theme.ts`.
- **Admin:** The Admin Portal uses Tailwind utility classes (e.g., `className="flex bg-white p-4"`). You don't need to write custom CSS; just edit the `className` string directly on the HTML elements in the specific file.
