@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instala Node.js 24 o posterior desde https://nodejs.org
 pause
 exit /b 1
)
set HOST=127.0.0.1
set PORT=3000
start "" "http://127.0.0.1:3000"
node server.js
pause
