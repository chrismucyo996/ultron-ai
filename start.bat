@echo off
rem Start Ultron AI. Installs the app's parts the first time, then opens it.
cd /d "%~dp0"

where bun >nul 2>nul
if errorlevel 1 (
  echo Bun is not installed yet.
  echo Install it by opening PowerShell and running:
  echo     powershell -c "irm https://bun.sh/install.ps1 ^| iex"
  echo Then close and reopen this window and double-click start.bat again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: downloading the parts Ultron needs, this takes a minute...
  call bun install
)

echo Starting Ultron AI. Open the address printed above in your browser.
call bun run dev
pause
