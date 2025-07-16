@echo off
echo ====================================
echo   CloudBite con Cloudflare Tunnel
echo ====================================

REM Verificar si existe la carpeta dist
if not exist "dist" (
    echo [!] La aplicacion no esta compilada. Compilando...
    call npm run build
    echo.
)

echo [1] Iniciando CloudBite Backend...
start /b node dist/src/main.js

echo [2] Esperando a que el backend este listo...
timeout /t 8 /nobreak > nul

echo [3] Iniciando Cloudflare Tunnel...
cloudflared tunnel --config .cloudflared\config.yml run cloudbite-prod