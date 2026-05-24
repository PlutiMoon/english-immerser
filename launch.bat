@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

echo  ╔══════════════════════════════╗
echo  ║   English Immerser           ║
echo  ║   听力带路 兴趣驱动          ║
echo  ╚══════════════════════════════╝
echo.

where cargo >nul 2>&1 || (
    echo [ERROR] Rust is not installed. Please install from https://rustup.rs
    pause
    exit /b 1
)

where node >nul 2>&1 || (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    call npm install
    echo.
)

echo [INFO] Launching English Immerser...
echo.
call npm run tauri dev
