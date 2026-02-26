# LinkCab Monorepo

A comprehensive ride-sharing platform with admin portal and mobile app.

## 🏗️ Project Structure: Monorepo with Clear Separation

```
LinkCab.in/
├── shared/              # Shared between all applications
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Basic UI (Button, Input, Card, etc.)
│   │   ├── verification/  # Verification components
│   │   ├── safety/        # Safety and trust components
│   │   └── common/        # Common utilities
│   ├── contexts/          # Shared contexts
│   │   ├── AuthContext.tsx
│   │   ├── VerificationContext.tsx
│   │   └── PaymentContext.tsx
│   ├── lib/             # Shared utilities
│   │   ├── supabase.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── types/           # Shared TypeScript types
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── verification.ts
│   │   └── ride.ts
│   └── constants/       # Shared constants
│       ├── theme.ts
│       ├── colors.ts
│       └── config.ts
├── admin-portal/        # Admin portal application
│   ├── src/
│   │   ├── app/           # Admin pages (Next.js App Router)
│   │   │   ├── (app)/
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── users/
│   │   │   │   │   management.tsx
│   │   │   │   ├── safety/
│   │   │   │   │   dashboard.tsx
│   │   │   │   └── ...
│   │   │   └── layout.tsx
│   ├── src/components/   # Admin-only components
│   │   ├── admin-sidebar.tsx
│   │   ├── user-management.tsx
│   │   ├── safety-dashboard.tsx
│   │   └── ...
│   ├── scripts/database/    # Database scripts
│   │   ├── database/
│   │   │   ├── 01-schema.sql
│   │   │   ├── 02-policies.sql
│   │   │   ├── 03-triggers.sql
│   │   │   ├── 04-storage.sql
│   │   │   ├── 05-functions.sql
│   │   │   ├── 06-sample-data.sql
│   │   │   └── setup-database.sql
│   └── package.json
├── mobile-app/          # Mobile application
│   ├── app/               # Mobile screens (Expo Router)
│   │   ├── (app)/
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── ...
│   │   ├── (app)/
│   │   │   ├── verification/
│   │   │   │   verification.tsx
│   │   │   └── profile.tsx
│   │   ├── (app)/
│   │   │   ├── rides/
│   │   │   │   ├── create.tsx
│   │   │   │   ├── list.tsx
│   │   │   │   └── ...
│   │   ├── (app)/
│   │   │   ├── chat/
│   │   │   │   ├── index.tsx
│   │   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/       # Mobile-only components
│   │   ├── RideCard.tsx
│   │   ├── OptimizedRideCard.tsx
│   │   ├── VerificationBadge.tsx
│   │   └── ...
│   ├── contexts/          # Mobile-only contexts
│   │   ├── AuthContext.tsx
│   │   ├── VerificationContext.tsx
│   │   └── PaymentContext.tsx
│   ├── lib/             # Mobile utilities
│   │   ├── supabase.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── package.json
├── crm-portal/         # Future CRM portal
│   ├── src/
│   │   ├── app/           # CRM pages (Next.js App Router)
│   │   │   ├── (app)/
│   │   │   ├── contacts/
│   │   │   │   list.tsx
│   │   │   │   details.tsx
│   │   │   └── ...
│   │   ├── (app)/
│   │   │   ├── deals/
│   │   │   │   ├── kanban.tsx
│   │   │   │   └── ...
│   │   └── layout.tsx
│   ├── src/components/   # CRM-only components
│   ├── src/lib/         # CRM utilities
│   └── package.json
└── docs/               # Documentation
    ├── api/           # API documentation
    ├── deployment/    # Deployment guides
    ├── database/      # Database documentation
    └── user-guides/    # User guides
```

## 🎯 **Why This Structure Works Best**

### **1. Shared Components Benefits**
- **No Duplication**: Single source of truth for UI components
- **Consistency**: Same look and feel across all apps
- **Maintenance**: Update once, applies everywhere
- **Testing**: Test components once, use everywhere

### **2. Clear Separation Benefits**
- **Focused Development**: Teams can work on specific areas
- **Reduced Conflicts**: Less merge conflicts
- **Clear Ownership**: Clear responsibility boundaries
- **Independent Deployment**: Deploy apps separately if needed

### **3. Monorepo Advantages**
- **Unified Vision**: Single project vision and direction
- **Shared Roadmap**: Combined development timeline
- **Easier Onboarding**: One setup for all team members
- **Cost Effective**: Single hosting, single CI/CD pipeline


## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
npm run install:all
```

### Development
```bash
# Start admin portal
npm run dev:admin

# Start mobile app
npm run dev:mobile

# Start both applications
npm run start:all
```

### Building
```bash
# Build admin portal
npm run build:admin

# Build mobile app
npm run build:mobile
```

### Database Setup
```bash
npm run setup:db
```

## 📦 Workspaces

- **shared**: Common components, contexts, utilities, and types
- **admin-portal**: Next.js admin dashboard
- **mobile-app**: Expo React Native mobile application

## 🧹 Cleaning
```bash
npm run clean
```

## 📋 Scripts

- `dev:admin` - Start admin portal in development mode
- `dev:mobile` - Start mobile app in development mode
- `build:admin` - Build admin portal for production
- `build:mobile` - Build mobile app for production
- `install:all` - Install dependencies for all workspaces
- `clean` - Clean all node_modules and build artifacts
- `lint` - Run linting across all workspaces
- `test` - Run tests across all workspaces
- `setup:db` - Set up database schema and policies
- `start:all` - Start both applications concurrently

## 🛠️ Tech Stack

- **Admin Portal**: Next.js, TypeScript, TailwindCSS
- **Mobile App**: Expo, React Native, TypeScript
- **Database**: Supabase
- **Shared**: TypeScript, React Context

## 📄 License

MIT
