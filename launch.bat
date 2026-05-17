@echo off
cd /d "D:\ALLCODE\英语一号"
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
echo Starting 英语沉浸式自学助手...
echo.
npx tauri dev
