# Guía de Publicación en Google Play Store

Esta guía te ayudará a publicar tu app Bite en Google Play Store de forma automatizada usando EAS (Expo Application Services).

## Requisitos Previos

1. **Cuenta de Google Play Console** ($25 único pago)

   - Crear cuenta en: https://play.google.com/console
   - Crear tu primera aplicación en la consola

2. **Configuración inicial en Play Console**:

   - Crear aplicación nueva
   - Completar todas las secciones requeridas:
     - Detalles de la app
     - Clasificación de contenido
     - Política de privacidad
     - Información de contacto
   - Subir al menos un APK/AAB manualmente la primera vez

3. **Service Account para automatización**:
   - Ve a Play Console → Configuración → Acceso a API
   - Crear proyecto en Google Cloud Console
   - Habilitar Google Play Android Developer API
   - Crear Service Account con permisos de "Release Manager"
   - Descargar el archivo JSON de credenciales

## Configuración del Proyecto

### 1. Preparar app.json para producción

```json
{
  "expo": {
    "name": "Bite",
    "slug": "bite-restaurant",
    "version": "1.0.0",
    "android": {
      "package": "com.tuempresa.bite",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": []
    }
  }
}
```

### 2. Configurar eas.json para Play Store

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "env": {
          "API_URL": "https://tu-api-produccion.com"
        }
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal",
        "releaseStatus": "draft",
        "changesNotSentForReview": false
      }
    }
  }
}
```

### 3. Variables de entorno para producción

Crear archivo `.env.production`:

```
API_URL=https://tu-api-produccion.com
```

## Proceso de Publicación Automatizado

### Método 1: Script NPM (Recomendado)

Agregar estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "build:prod": "eas build --platform android --profile production",
    "submit:prod": "eas submit --platform android --profile production",
    "release:prod": "npm run build:prod && npm run submit:prod",
    "release:prod:auto": "eas build --platform android --profile production --auto-submit"
  }
}
```

### Método 2: GitHub Actions (CI/CD)

Crear `.github/workflows/release.yml`:

```yaml
name: Release to Play Store

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build and Submit
        run: eas build --platform android --profile production --auto-submit --non-interactive
```

## Pasos para Publicar

### Primera vez (configuración):

```bash
# 1. Login en EAS
eas login

# 2. Configurar el proyecto
eas build:configure

# 3. Guardar el service account JSON
cp ~/Downloads/tu-service-account.json ./google-play-service-account.json

# 4. Agregar a .gitignore
echo "google-play-service-account.json" >> .gitignore
```

### Publicación regular:

```bash
# Opción 1: Build y submit por separado
npm run build:prod
# Esperar a que termine el build
npm run submit:prod

# Opción 2: Todo automatizado
npm run release:prod:auto

# Opción 3: Con versión específica
eas build --platform android --profile production --auto-submit --message "Version 1.0.1: Bug fixes"
```

## Configuración de Tracks en Play Store

- **internal**: Testing interno (recomendado para empezar)
- **alpha**: Testing cerrado
- **beta**: Testing abierto
- **production**: Producción

Modificar en `eas.json`:

```json
"track": "internal"  // cambiar según necesites
```

## Automatización Completa con Script

Crear `scripts/release-to-playstore.sh`:

```bash
#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando release a Play Store...${NC}"

# 1. Verificar que estamos en main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Debes estar en la rama main para hacer release"
    exit 1
fi

# 2. Actualizar version en app.json
echo -e "${YELLOW}📝 Ingresa la nueva versión (actual: $(node -p "require('./app.json').expo.version")):${NC}"
read VERSION

# 3. Actualizar versionCode
CURRENT_VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

# 4. Actualizar app.json
node -e "
const fs = require('fs');
const appJson = require('./app.json');
appJson.expo.version = '$VERSION';
appJson.expo.android.versionCode = $NEW_VERSION_CODE;
fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2));
"

echo -e "${GREEN}✅ Versión actualizada a $VERSION (versionCode: $NEW_VERSION_CODE)${NC}"

# 5. Commit cambios
git add app.json
git commit -m "Release v$VERSION"
git tag "v$VERSION"

# 6. Build y submit
echo -e "${YELLOW}🏗️  Iniciando build y submit...${NC}"
eas build --platform android --profile production --auto-submit --non-interactive

# 7. Push cambios
git push origin main --tags

echo -e "${GREEN}✅ Release completado!${NC}"
```

Hacer ejecutable:

```bash
chmod +x scripts/release-to-playstore.sh
```

## Tips y Mejores Prácticas

1. **Versionado**: Siempre incrementa `versionCode` para cada build
2. **Testing**: Usa track "internal" primero antes de producción
3. **Changelogs**: Mantén un CHANGELOG.md actualizado
4. **Assets**: Prepara todos los assets requeridos:
   - Screenshots (mínimo 2)
   - Feature graphic (1024x500)
   - Icono alta resolución (512x512)
5. **Monitoreo**: Configura Sentry o similar para crashes en producción

## Troubleshooting

- **Error de permisos**: Verifica que el Service Account tenga rol "Release Manager"
- **Build fallido**: Revisa los logs en https://expo.dev
- **Versión rechazada**: Incrementa `versionCode` e intenta de nuevo
