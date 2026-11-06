@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Tianji installer for Windows
REM -----------------------------
REM ASCII-only on purpose. cmd parses this file in the OEM code page before any
REM chcp takes effect for the rest of the file, so non-ASCII text in the script
REM body can be split mid-character and executed as a command. Keeping the
REM script pure ASCII removes that failure mode entirely.

set "SRC=%~dp0"
set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=%LOCALAPPDATA%\Tianji\bin"

echo.
echo   Tianji installer
echo   ============================================
echo   Target: %TARGET%
echo.

if not exist "%SRC%tianji.exe" (
  echo   [ERROR] tianji.exe not found next to this script.
  exit /b 1
)

if not exist "%TARGET%" mkdir "%TARGET%" 2>nul
if not exist "%TARGET%" (
  echo   [ERROR] Cannot create the target folder.
  exit /b 1
)

copy /Y "%SRC%tianji.exe" "%TARGET%\tianji.exe" >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Copy failed. Check permissions on the target folder.
  exit /b 1
)
echo   [ok] tianji.exe installed

if /I "%TIANJI_INSTALL_NO_PATH%"=="1" (
  echo   [--] PATH untouched ^(TIANJI_INSTALL_NO_PATH=1^)
  goto :finish
)

REM Update the *user* PATH. Idempotent: the folder is appended at most once.
set "PS_SCRIPT=$t='%TARGET%'; $p=[Environment]::GetEnvironmentVariable('Path','User'); if ([string]::IsNullOrWhiteSpace($p)) { $p='' } $parts=@($p -split ';' | Where-Object { $_ -ne '' }); if ($parts -notcontains $t) { $new=(@($parts) + $t) -join ';'; [Environment]::SetEnvironmentVariable('Path',$new,'User'); Write-Host '   [ok] added to user PATH' } else { Write-Host '   [--] already in user PATH' }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "%PS_SCRIPT%" > "%TEMP%\tianji-path.txt" 2>&1
type "%TEMP%\tianji-path.txt"
del "%TEMP%\tianji-path.txt" >nul 2>&1

:finish
echo.
echo   Verify in a NEW terminal window:
echo       tianji doctor
echo.
echo   Common commands
echo       tianji ask "Should I change jobs?" --domain career --gender female
echo       tianji serve
echo       tianji ledger
echo.
echo   Uninstall: delete the folder above and remove it from PATH.
echo   No registry keys are written by this installer.
echo.

endlocal
exit /b 0
