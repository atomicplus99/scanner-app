@echo off
cd /d C:\nginx
taskkill /f /im nginx.exe
timeout /t 2 /nobreak >nul
start nginx.exe
echo Nginx reiniciado
pause
