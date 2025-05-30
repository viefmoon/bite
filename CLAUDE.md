# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a restaurant management system with two main components:
- **Backend**: NestJS API for restaurant operations (orders, products, thermal printing, etc.)
- **App**: React Native mobile app built with Expo and Ignite boilerplate

## Backend Commands

### Development
```bash
cd backend
npm install
npm run start:dev     # Start in watch mode
npm run start:debug   # Start with debugger
npm run start:prod    # Start production build
```

### Database & Migrations
```bash
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
npm run seed:run:relational  # Run database seeds
```

### Testing & Quality
```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
npm run lint              # ESLint
npm run format            # Prettier format
```

### Code Generation
```bash
npm run generate:resource:relational  # Generate new CRUD resource
npm run add:property:to-relational    # Add property to existing entity
```

## App Commands

### Development
```bash
cd app
npm install
npm run start            # Start Expo dev server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run in web browser
```

### Building
```bash
npm run build:ios:sim    # Build for iOS simulator
npm run build:android:sim # Build for Android emulator
npm run build:ios:dev    # Build for iOS device
npm run build:android:dev # Build for Android device
```

### Testing & Quality
```bash
npm run test            # Jest tests
npm run test:watch      # Jest in watch mode
npm run lint            # ESLint with auto-fix
npm run compile         # TypeScript check
```

## Architecture Overview

### Backend Architecture

**Core Business Modules:**
- `orders/` - Order management with history tracking via TypeORM subscribers
- `products/` - Products with variants and modifiers
- `thermal-printers/` - Network printer discovery and printing
- `payments/` - Payment processing
- `customers/` - Customer and address management
- `areas/` & `tables/` - Restaurant layout management

**Infrastructure Patterns:**
- Repository pattern with TypeORM entities
- Domain models separate from entities
- DTOs for request/response validation
- Mappers for entity-domain conversion
- Module-based organization following NestJS conventions

**Key Features:**
- JWT authentication with refresh tokens
- Email-based auth (no social logins implemented)
- File uploads supporting local/S3 storage (configurable via FILE_DRIVER)
- Swagger API documentation on all endpoints
- Order change tracking with jsondiffpatch

### App Architecture

**Navigation:**
- React Navigation with native stack
- Authentication flow separate from main app flow

**State Management:**
- Supabase for backend communication
- React hooks for local state
- AsyncStorage for persistence

**Key Screens:**
- BLE device configuration and monitoring
- Dashboard for device metrics
- Authentication (login/register)

**BLE Integration:**
- Custom BLE hooks for device communication
- Configuration forms for various sensor types (pH, conductivity, temperature)
- Real-time data monitoring

## Important Configuration

### Backend Environment
Create `.env` from `env-example-relational`:
- `DATABASE_*` - PostgreSQL connection
- `FILE_DRIVER` - 'local', 's3', or 's3-presigned'
- `AUTH_JWT_SECRET` - Must be changed in production
- `MAIL_*` - Email service configuration

### App Configuration
- `app/config/` - Environment-specific configs
- Supabase configuration in `services/supabase.ts`
- BLE permissions configured for both iOS and Android

## Development Notes

1. Backend uses PostgreSQL with TypeORM
2. Order changes are automatically tracked via subscribers
3. Thermal printer discovery uses network scanning
4. App requires BLE permissions for sensor communication
5. Both projects use TypeScript with strict configurations