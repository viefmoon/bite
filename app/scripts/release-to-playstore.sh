#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando release a Play Store...${NC}"

# 1. Verificar que estamos en main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo -e "${RED}❌ Debes estar en la rama main para hacer release${NC}"
    exit 1
fi

# 2. Verificar que no hay cambios sin commitear
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Hay cambios sin commitear. Por favor commitea o stashea los cambios primero.${NC}"
    exit 1
fi

# 3. Obtener versión actual
CURRENT_VERSION=$(node -p "require('./app.json').expo.version")
echo -e "${GREEN}Versión actual: $CURRENT_VERSION${NC}"

# 4. Solicitar nueva versión
echo -e "${YELLOW}📝 Ingresa la nueva versión (formato: X.Y.Z):${NC}"
read VERSION

# Validar formato de versión
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Formato de versión inválido. Usa X.Y.Z (ej: 1.0.1)${NC}"
    exit 1
fi

# 5. Actualizar versionCode
CURRENT_VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

# 6. Actualizar app.json
node -e "
const fs = require('fs');
const appJson = require('./app.json');
appJson.expo.version = '$VERSION';
appJson.expo.android.versionCode = $NEW_VERSION_CODE;
fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2));
"

echo -e "${GREEN}✅ Versión actualizada a $VERSION (versionCode: $NEW_VERSION_CODE)${NC}"

# 7. Solicitar mensaje de release
echo -e "${YELLOW}📝 Ingresa una descripción breve de los cambios:${NC}"
read RELEASE_MESSAGE

# 8. Commit cambios
git add app.json
git commit -m "Release v$VERSION: $RELEASE_MESSAGE"
git tag "v$VERSION"

# 9. Verificar credenciales de Google Play
if [ ! -f "./google-play-service-account.json" ]; then
    echo -e "${RED}❌ No se encontró google-play-service-account.json${NC}"
    echo -e "${YELLOW}Por favor, descarga el archivo de credenciales de Google Play Console y guárdalo como google-play-service-account.json${NC}"
    exit 1
fi

# 10. Confirmar build
echo -e "${YELLOW}¿Deseas continuar con el build y publicación? (s/n)${NC}"
read CONFIRM

if [ "$CONFIRM" != "s" ]; then
    echo -e "${RED}❌ Release cancelado${NC}"
    # Revertir cambios
    git reset --hard HEAD~1
    git tag -d "v$VERSION"
    exit 1
fi

# 11. Build y submit
echo -e "${YELLOW}🏗️  Iniciando build y submit a Play Store...${NC}"
eas build --platform android --profile production --auto-submit --non-interactive --message "v$VERSION: $RELEASE_MESSAGE"

# 12. Push cambios si el build fue exitoso
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}📤 Subiendo cambios a repositorio...${NC}"
    git push origin main --tags
    echo -e "${GREEN}✅ Release v$VERSION completado exitosamente!${NC}"
    echo -e "${GREEN}📱 Tu app será revisada y publicada en el track 'internal' de Play Store${NC}"
else
    echo -e "${RED}❌ Error en el build. Los cambios locales no se han subido.${NC}"
    echo -e "${YELLOW}Para revertir los cambios locales, ejecuta:${NC}"
    echo "git reset --hard HEAD~1 && git tag -d v$VERSION"
fi