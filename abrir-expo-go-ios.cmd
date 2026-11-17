@echo off
setlocal EnableExtensions
title MapPin - Expo Go no iPhone
cd /d "%~dp0"

:prepare
set "MAPPIN_NODE_EXE="
for /f "delims=" %%A in ('where node.exe 2^>nul') do if not defined MAPPIN_NODE_EXE set "MAPPIN_NODE_EXE=%%A"
if not defined MAPPIN_NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "MAPPIN_NODE_EXE=%ProgramFiles%\nodejs\node.exe"

if not defined MAPPIN_NODE_EXE goto :bootstrap
for %%A in ("%MAPPIN_NODE_EXE%") do set "MAPPIN_NODE_DIR=%%~dpA"
set "PATH=%MAPPIN_NODE_DIR%;%PATH%"
set "MAPPIN_NPM=%MAPPIN_NODE_DIR%npm.cmd"
set "MAPPIN_NPX=%MAPPIN_NODE_DIR%npx.cmd"

if not exist "%MAPPIN_NPM%" goto :bootstrap
if not exist "node_modules\expo\package.json" goto :bootstrap
goto :login

:bootstrap
echo.
echo Preparando este computador para executar o MapPin...
call "%~dp0preparar-pc-mappin.cmd" --continue
if errorlevel 1 (
  echo.
  echo A preparacao falhou. Leia a mensagem acima e tente novamente.
  pause
  exit /b 1
)
goto :prepare

:login
set "MAPPIN_EXPO_USER="
for /f "usebackq delims=" %%A in (`"%MAPPIN_NPX%" expo whoami 2^>nul`) do set "MAPPIN_EXPO_USER=%%A"
if not defined MAPPIN_EXPO_USER set "MAPPIN_EXPO_USER=Not logged in"

if /I "%MAPPIN_EXPO_USER%"=="Not logged in" (
  echo.
  echo ==============================================
  echo       ENTRE COM SUA CONTA EXPO NO TERMINAL
  echo ==============================================
  echo Use a mesma conta no Expo Go do iPhone.
  echo.
  "%MAPPIN_NPX%" expo login --no-browser
  if errorlevel 1 (
    echo.
    echo O login nao foi concluido. Tente novamente.
    pause
    exit /b 1
  )
  goto :login
)

echo.
echo Conta Expo: %MAPPIN_EXPO_USER%
echo Iniciando o tunel. Mantenha esta janela aberta.
echo Quando aparecer o QR Code, escaneie-o com a camera do iPhone.
call "%MAPPIN_NPM%" run expo-go:ios
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar a previa. Leia a mensagem acima antes de fechar a janela.
  pause
)
