@echo off
setlocal EnableExtensions
title MapPin - Preparar computador

set "MAPPIN_ROOT=%~dp0"
pushd "%MAPPIN_ROOT%" >nul 2>&1
if errorlevel 1 (
  echo Nao foi possivel abrir a pasta do MapPin.
  pause
  exit /b 1
)

echo ==============================================
echo          Preparacao do MapPin para Windows
echo ==============================================
echo.

set "MAPPIN_NODE_EXE="
for /f "delims=" %%A in ('where node.exe 2^>nul') do if not defined MAPPIN_NODE_EXE set "MAPPIN_NODE_EXE=%%A"
if not defined MAPPIN_NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "MAPPIN_NODE_EXE=%ProgramFiles%\nodejs\node.exe"

if defined MAPPIN_NODE_EXE goto :validateNode

echo Node.js nao foi encontrado. Instalando o Node.js LTS...
where winget.exe >nul 2>&1
if errorlevel 1 goto :wingetMissing

winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo A instalacao do Node.js falhou ou foi cancelada.
  pause
  popd
  exit /b 1
)

set "MAPPIN_NODE_EXE="
for /f "delims=" %%A in ('where node.exe 2^>nul') do if not defined MAPPIN_NODE_EXE set "MAPPIN_NODE_EXE=%%A"
if not defined MAPPIN_NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "MAPPIN_NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined MAPPIN_NODE_EXE (
  echo O Node.js foi instalado, mas ainda nao esta disponivel nesta janela.
  echo Feche esta janela e execute este arquivo novamente.
  pause
  popd
  exit /b 1
)

:validateNode
for %%A in ("%MAPPIN_NODE_EXE%") do set "MAPPIN_NODE_DIR=%%~dpA"
set "PATH=%MAPPIN_NODE_DIR%;%PATH%"
set "MAPPIN_NPM=%MAPPIN_NODE_DIR%npm.cmd"

for /f "tokens=1,2 delims=." %%A in ('"%MAPPIN_NODE_EXE%" -p "process.versions.node"') do (
  set "MAPPIN_NODE_MAJOR=%%A"
  set "MAPPIN_NODE_MINOR=%%B"
)
if %MAPPIN_NODE_MAJOR% LSS 22 goto :nodeTooOld
if %MAPPIN_NODE_MAJOR% EQU 22 if %MAPPIN_NODE_MINOR% LSS 13 goto :nodeTooOld

echo Node.js %MAPPIN_NODE_MAJOR%.%MAPPIN_NODE_MINOR% encontrado.
echo.
echo Instalando as dependencias exatas do projeto. Isto pode levar alguns minutos...
call "%MAPPIN_NPM%" ci
if errorlevel 1 (
  echo Nao foi possivel instalar as dependencias. Verifique sua internet e tente novamente.
  pause
  popd
  exit /b 1
)

echo.
echo Preparacao concluida.
echo Agora execute abrir-expo-go-ios.cmd para entrar na Expo e gerar o QR Code do iPhone.
if /I "%~1"=="--continue" (
  popd
  exit /b 0
)
pause
popd
exit /b 0

:nodeTooOld
echo O Node.js encontrado e antigo. Instale o Node.js 22.13 ou superior em https://nodejs.org.
pause
popd
exit /b 1

:wingetMissing
echo O winget nao esta disponivel neste Windows.
echo Instale o Node.js 22.13 ou superior em https://nodejs.org, feche esta janela e execute este arquivo novamente.
pause
popd
exit /b 1
