@echo off
setlocal EnableDelayedExpansion
title GreenOps — Cloud Sustainability Dashboard
color 0A

echo.
echo  ============================================================
echo   GreenOps ^| Cloud Sustainability Dashboard  ^| Starting...
echo  ============================================================
echo.

:: ── Verify Node.js ────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;!PATH!"
    ) else (
        echo  [ERROR] Node.js not found. Run INSTALL.bat first.
        pause & exit /b 1
    )
)

:: ── Verify backend node_modules ───────────────────────────────────────────
if not exist "%~dp0backend\node_modules" (
    color 0E
    echo  [!] Dependencies not installed. Running installer first...
    echo.
    call "%~dp0INSTALL.bat"
)

:: ── Verify frontend node_modules ──────────────────────────────────────────
if not exist "%~dp0frontend\node_modules" (
    color 0E
    echo  [!] Frontend dependencies not installed. Running installer first...
    echo.
    call "%~dp0INSTALL.bat"
)

echo  [1/2] Starting backend API + WebSocket server on port 3001...
cd /d "%~dp0backend"
start "GreenOps-Backend" cmd /k "title GreenOps Backend && node src/index.js"

echo  Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo  [2/2] Starting frontend dev server on port 5173...
cd /d "%~dp0frontend"
start "GreenOps-Frontend" cmd /k "title GreenOps Frontend && npm run dev"

echo  Waiting for frontend to compile...
timeout /t 5 /nobreak >nul

echo.
echo  Opening dashboard in your browser...
start "" "http://localhost:5173"

echo.
echo  ============================================================
echo   GreenOps is running!
echo.
echo   Dashboard : http://localhost:5173
echo   Backend   : http://localhost:3001
echo   Metrics   : http://localhost:3001/api/metrics
echo   Forecast  : http://localhost:3001/api/forecast
echo  ============================================================
echo.
echo  Two terminal windows have opened (Backend + Frontend).
echo  Close those windows to stop the servers.
echo.
pause
