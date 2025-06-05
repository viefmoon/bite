# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instrucciones Importantes

**IMPORTANTE**: Siempre responder en español en todas las interacciones.

## Project Overview

This is a restaurant management system with two main components:
- **Backend**: NestJS API for restaurant operations (orders, products, thermal printing, etc.)
- **App**: React Native mobile app built with Expo

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

# Comandos directos
npm run start           # Start Expo dev server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator  
npm run web             # Run in web browser
```

### Desarrollo con Dispositivo Físico

**Configuración inicial (una sola vez):**
1. Instala el APK en tu dispositivo:
   ```bash
   adb install build-*.apk
   ```

**Desarrollo diario:**
```bash
cd app
npm start    # Inicia el servidor de desarrollo
```

**Nota:** Si tienes problemas de conexión de red, puedes usar `npx expo start --tunnel` para un modo más confiable aunque ligeramente más lento.

### Building (Local con EAS)

#### Setup Inicial (solo la primera vez)
```bash
# 1. Instalar herramientas necesarias
cd app
./scripts/install-java.sh        # Instala Java
./scripts/install-android-sdk.sh # Instala Android SDK (si existe)
source ~/.bashrc                 # Cargar variables de entorno

# 2. Login en EAS
npx eas login
```

#### Crear Builds Locales
```bash
npm run build:ios:sim      # Build para iOS simulator
npm run build:android:sim  # Build para Android emulator
npm run build:ios:dev      # Build para iOS device  
npm run build:android:dev  # Build para Android device (APK)
npm run build:android:prod # Build de producción
```

#### Instalar y Ejecutar
```bash
# Instalar APK en dispositivo Android
adb install build-*.apk

# Ejecutar servidor de desarrollo
npm start
```

**Nota**: Los archivos de build se generan en la raíz del proyecto como `build-*.apk`

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
- React Navigation with drawer and stack navigators
- Authentication flow separate from main app flow
- Module-based navigation structure

**State Management:**
- Zustand stores for global state (auth, theme, snackbar)
- React Query for API state and caching
- AsyncStorage for persistence

**Key Screens:**
- Order creation with product customization
- Open orders management
- Product catalog with categories and variants
- Table and area configuration
- Thermal printer setup and testing

**API Integration:**
- Custom API client with interceptors
- Automatic token refresh
- Error mapping and handling
- Image caching system

## Important Configuration

### Backend Environment
Create `.env` from `env-example-relational`:
- `DATABASE_*` - PostgreSQL connection
- `FILE_DRIVER` - 'local', 's3', or 's3-presigned'
- `AUTH_JWT_SECRET` - Must be changed in production
- `MAIL_*` - Email service configuration

### App Configuration
- `app/.env` - API_URL and other environment variables
- Module-specific services in each module's `services/` directory
- Global configuration in `app/constants/`
- Theme configuration in `app/styles/`

## Development Notes

1. Backend uses PostgreSQL with TypeORM
2. Order changes are automatically tracked via subscribers
3. Thermal printer discovery uses network scanning
4. App supports both light and dark themes
5. Both projects use TypeScript with strict configurations
6. Backend includes Hygen generators for scaffolding
7. App uses React Hook Form for form validation
8. File uploads support multiple storage backends