# Guía para Crear un Nuevo Proyecto EAS

Esta guía te ayudará a desvincular el proyecto actual de EAS y crear uno nuevo con el slug "bite-restaurant".

## Prerrequisitos

- Tener instalado EAS CLI: `npm install -g eas-cli`
- Estar logueado en tu cuenta de Expo: `eas login`
- Tener el proyecto React Native/Expo funcionando localmente

## Paso 1: Verificar el Estado Actual del Proyecto

```bash
cd app
eas project:info
```

Esto mostrará información sobre el proyecto actual vinculado a EAS (si existe).

## Paso 2: Desvincular el Proyecto Actual

### Opción A: Limpiar completamente la configuración (recomendado)

1. Eliminar el ID del proyecto del archivo `app.json`:
   ```json
   {
     "expo": {
       // Eliminar esta línea si existe:
       "extra": {
         "eas": {
           "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
         }
       }
     }
   }
   ```

2. Eliminar la carpeta .expo si existe:
   ```bash
   rm -rf .expo
   ```

3. Verificar que no hay archivos de configuración EAS locales:
   ```bash
   # Estos archivos normalmente no existen, pero verificar por si acaso
   ls -la .easignore .eas.json 2>/dev/null
   ```

## Paso 3: Actualizar app.json con el Nuevo Slug

Editar `app/app.json` y asegurarse de que tenga la configuración correcta:

```json
{
  "expo": {
    "name": "Bite Restaurant",
    "slug": "bite-restaurant",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B6B"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.biterestaurant.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF6B6B"
      },
      "package": "com.biterestaurant.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FF6B6B",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "scheme": "bite-restaurant"
  }
}
```

## Paso 4: Crear el Nuevo Proyecto en EAS

```bash
# Inicializar EAS con el nuevo proyecto
eas init

# Si ya tienes un proyecto vinculado, usa:
eas project:init
```

Durante este proceso:
1. EAS detectará el slug "bite-restaurant"
2. Te preguntará si quieres crear un nuevo proyecto
3. Selecciona "Yes" para crear el nuevo proyecto
4. EAS generará un nuevo project ID y lo agregará a tu app.json

## Paso 5: Verificar la Configuración de EAS

Asegúrate de que `app/eas.json` esté configurado correctamente:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Paso 6: Verificar el Nuevo Proyecto

```bash
# Verificar que el proyecto esté correctamente vinculado
eas project:info

# Debería mostrar:
# Project: bite-restaurant
# ID: [nuevo-project-id]
# Owner: [tu-usuario]
```

## Paso 7: Configurar los Secretos del Proyecto (Opcional)

Si tu proyecto necesita variables de entorno secretas:

```bash
# Configurar secretos para el nuevo proyecto
eas secret:create --name API_URL --value "https://tu-api.com"
eas secret:create --name OTRO_SECRETO --value "valor-secreto"

# Listar secretos configurados
eas secret:list
```

## Paso 8: Realizar una Build de Prueba

Para verificar que todo esté funcionando correctamente:

```bash
# Build de desarrollo para Android
eas build --platform android --profile development

# Build de desarrollo para iOS
eas build --platform ios --profile development
```

## Troubleshooting

### Error: "Project already exists"
Si EAS dice que el proyecto ya existe con ese slug:
1. Intenta con un slug diferente (ej: "bite-restaurant-app")
2. O contacta al soporte de Expo para liberar el slug si es tuyo

### Error: "Invalid project ID"
Si hay problemas con el project ID:
1. Elimina completamente la sección `extra.eas` de app.json
2. Ejecuta `eas init` nuevamente

### Error: "Authentication required"
Si tienes problemas de autenticación:
```bash
eas logout
eas login
```

## Notas Importantes

1. **Backup**: Antes de desvincular, asegúrate de tener un backup de cualquier configuración importante
2. **Builds anteriores**: Las builds del proyecto anterior seguirán disponibles en tu cuenta de Expo
3. **Colaboradores**: Si tienes colaboradores, deberán actualizar su configuración local después del cambio
4. **CI/CD**: Si usas CI/CD, actualiza las variables de entorno con el nuevo project ID

## Comandos Útiles

```bash
# Ver todos tus proyectos en EAS
eas project:list

# Ver información detallada del proyecto actual
eas project:info

# Ver el estado de las builds
eas build:list

# Cancelar una build en progreso
eas build:cancel [build-id]
```

## Siguiente Paso

Una vez completada la configuración, puedes continuar con el desarrollo normal:

```bash
# Desarrollo local
npm start

# Crear builds
npm run build:android:dev
npm run build:ios:dev
```