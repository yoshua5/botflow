@echo off
REM Detener procesos npm/node anteriores
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2

REM Navegar a la carpeta del proyecto
cd /d "%~dp0"

REM Instalar dependencias
echo Instalando dependencias...
call npm install --legacy-peer-deps

REM Iniciar el servidor
echo.
echo ✓ Iniciando servidor...
call npm run dev

pause
