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
npm run start:dev     # Start in watch mode (puerto 3737)
npm run start:debug   # Start with debugger (puerto 3737)
npm run start:prod    # Start production build (puerto 3737)
```

**IMPORTANTE**: El backend ahora usa el puerto 3737 para permitir auto-descubrimiento desde la app.

### Database & Migrations
```bash
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
npm run seed:run:relational  # Run database seeds

# Reset de la base de datos
npm run db:reset           # Elimina TODA la base de datos y la recrea vacía
npm run db:clear-migrations # Solo elimina la tabla de migraciones
npm run db:fresh           # Reset completo + migraciones + seeds
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
npm run compile:check   # TypeScript check (ignorando errores conocidos de React)
```

### Problemas Conocidos

#### Estado de TypeScript
La aplicación tiene configuración de TypeScript mejorada con soporte para:
- JSX con `react-jsx`
- ESModule interoperability
- Aliases de rutas con `@/` para `src/`
- Validación estricta habilitada

Algunos módulos aún tienen errores de TypeScript pendientes de resolver, principalmente relacionados con:
- Incompatibilidades de tipos entre diferentes servicios y schemas
- Importaciones con paths absolutos vs relativos
- Configuración de responsive utilities

Para verificar errores de TypeScript: `npm run compile`

## Architecture Overview

### Backend Architecture

**Core Business Modules:**
- `orders/` - Order management with history tracking via TypeORM subscribers
- `products/` - Products with variants and modifiers
- `thermal-printers/` - Network printer discovery and printing
- `payments/` - Payment processing
- `customers/` - Customer and address management
- `areas/` & `tables/` - Restaurant layout management
- `restaurant-config/` - Restaurant configuration (hours, acceptance status)
- `audio-order-processing/` - Voice order processing with remote AI service integration

**Infrastructure Patterns:**
- Repository pattern with TypeORM entities
- Domain models separate from entities
- DTOs for request/response validation
- Mappers for entity-domain conversion
- Module-based organization following NestJS conventions
- Subscriber pattern for order history tracking

**Key Features:**
- JWT authentication with refresh tokens
- Email-based auth (no social logins implemented)
- File uploads supporting local/S3 storage (configurable via FILE_DRIVER)
- Swagger API documentation on all endpoints
- Order change tracking with jsondiffpatch
- Thermal printer integration via node-thermal-printer
- Voice order processing with speech recognition and AI parsing

### App Architecture

**Navigation:**
- React Navigation with drawer and stack navigators
- Authentication flow separate from main app flow
- Module-based navigation structure
- Each module has its own navigation stack

**State Management:**
- Zustand stores for global state (auth, theme, snackbar)
- React Query for API state and caching
- AsyncStorage for persistence
- React Hook Form for form state management

**Key Screens:**
- Order creation with product customization and voice input
- Open orders management
- Product catalog with categories and variants
- Table and area configuration
- Thermal printer setup and testing
- Restaurant configuration management

**API Integration:**
- Custom API client with interceptors
- Automatic token refresh
- Error mapping and handling
- Image caching system
- Axios with retry mechanism

**Module Structure:**
```
app/src/modules/
├── auth/           # Authentication screens and logic
├── orders/         # Order management and creation
├── products/       # Product catalog and management
├── tables/         # Table and area management
├── printers/       # Thermal printer configuration
├── payments/       # Payment processing
├── customers/      # Customer management
└── restaurantConfig/ # Restaurant settings
```

## Important Configuration

### Backend Environment
Create `.env` from `env-example-relational`:
- `APP_PORT` - Puerto del servidor (debe ser 3737)
- `DATABASE_*` - PostgreSQL connection
- `FILE_DRIVER` - 'local', 's3', or 's3-presigned'
- `AUTH_JWT_SECRET` - Must be changed in production
- `MAIL_*` - Email service configuration
- `CLOUD_API_URL` - URL for remote services (sync, audio processing)
- `CLOUD_API_KEY` - API key for remote services authentication

### App Configuration
- **Auto-descubrimiento**: La app encuentra automáticamente el backend en la red local (puerto 3737)
- **Cero configuración**: No requiere archivos `.env` ni configuración manual
- Module-specific services in each module's `services/` directory
- Global configuration in `app/constants/`
- Theme configuration in `app/styles/`
- Path aliases: `@/` resolves to `src/`

### Sistema de Auto-Descubrimiento
La app implementa un sistema robusto de auto-descubrimiento del backend:
1. Escanea la red local buscando el servidor en el puerto 3737
2. Cachea la URL encontrada para uso posterior
3. Incluye fallback para última URL conocida
4. Soporta re-descubrimiento manual si cambia la IP del servidor

## Development Notes

### Backend
1. Uses PostgreSQL with TypeORM
2. Order changes automatically tracked via subscribers
3. Thermal printer discovery uses network scanning
4. Hygen generators for scaffolding new resources
5. TypeORM migrations must be generated after entity changes
6. Seeds can be run with `npm run seed:run:relational`

### App
1. Supports both light and dark themes
2. Material Design 3 with React Native Paper
3. Custom theme system with consistent spacing
4. React Hook Form with Zod validation
5. FlashList for performant lists
6. Image caching with expo-image

### Common Patterns
1. All API responses follow consistent format with data/message/errors
2. Error handling uses custom error types
3. Form validation uses Zod schemas
4. Lists use FlashList for performance
5. Navigation types are strictly typed
6. Services layer abstracts API calls from components