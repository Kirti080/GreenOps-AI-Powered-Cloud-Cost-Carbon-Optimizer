@echo off
setlocal EnableDelayedExpansion
title GreenOps — Installing Dependencies
color 0A

echo.
echo  ============================================================
echo   GreenOps ^| Installing Dependencies
echo  ============================================================
echo.

:: ── Check Node.js (try PATH first, then common install locations) ──────────
set NODE_EXE=node
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
        set "PATH=C:\Program Files\nodejs;!PATH!"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
        set "PATH=C:\Program Files (x86)\nodejs;!PATH!"
    ) else (
        color 0C
        echo  [ERROR] Node.js not found. Please install from https://nodejs.org
        pause & exit /b 1
    )
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found
echo.

:: ── Install Backend ────────────────────────────────────────────────────────
echo  Installing backend packages (express, ws, cors, uuid)...
echo  This may take 30-60 seconds on first run.
echo.
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Backend install failed. Check your internet connection.
    pause
    exit /b 1
)
echo.
echo  [OK] Backend dependencies installed!
echo.

:: ── Install Frontend ───────────────────────────────────────────────────────
echo  Installing frontend packages (react, vite, three.js, recharts...)...
echo  This may take 60-120 seconds on first run.
echo.
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Frontend install failed. Check your internet connection.
    pause
    exit /b 1
)
echo.
echo  [OK] Frontend dependencies installed!
echo.

echo  ============================================================
echo   All dependencies installed successfully!
echo   Now run START.bat to launch the project.
echo  ============================================================
echo.
pause
