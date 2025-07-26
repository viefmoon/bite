# Guía para la Primera Subida a Play Store

## Generar y subir tu primer AAB (Android App Bundle)

### 1. Generar el AAB de producción

```bash
cd app

# Asegúrate de estar logueado en EAS
eas login

# Generar el AAB de producción
eas build --platform android --profile production
```

### 2. Descargar el AAB

Una vez que el build termine (aproximadamente 15-20 minutos):

1. Ve a https://expo.dev y busca tu build
2. Descarga el archivo `.aab`
3. O usa el comando: `eas build:download --platform android`

### 3. Subir a Play Store

En la pantalla que estás viendo:

1. Haz clic en "Subir" (el botón junto a "Suelta los paquetes de aplicaciones aquí para subirlos")
2. Selecciona el archivo `.aab` que descargaste
3. Espera a que se procese

### 4. Completar información de la versión

Después de subir el AAB:

1. **Nombre de la versión**: Se llenará automáticamente (ej: "1.0.0")
2. **Notas de la versión**: Escribe algo como:

   ```
   - Versión inicial de Bite
   - Sistema de gestión de restaurante
   - Gestión de pedidos y mesas
   - Impresión térmica
   ```

3. Haz clic en "Guardar"

### 5. Configurar el lanzamiento

1. Ve a "Pruebas" → "Prueba interna"
2. Crea un nuevo lanzamiento
3. Agrega el AAB que subiste
4. Completa las notas de la versión
5. Revisa y lanza

## Importante

- Esta primera subida DEBE hacerse manualmente
- Después de esta primera subida, podrás usar la automatización con EAS Submit
- El AAB debe estar firmado (EAS lo hace automáticamente)
- Google Play procesará el AAB y generará APKs optimizados para cada dispositivo

## Próximos pasos

Una vez que hayas subido el primer AAB:

1. Completa todas las secciones requeridas en Play Console:

   - Descripción de la app
   - Capturas de pantalla
   - Categorización
   - Clasificación de contenido
   - Política de privacidad

2. Configura el Service Account para automatización futura
3. Usa `npm run release:playstore` para publicaciones futuras
