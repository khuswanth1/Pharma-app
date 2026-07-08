@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================================
echo  PHARMACY BACKEND - FULL DUPLICATE PACKAGE CLEANUP + BUILD
echo ==========================================================
echo.

echo [STEP 1] Removing all com\anandpharmacy directories from every service...
echo.

for %%S in (api-gateway auth-service product-service cart-service order-service payment-service common-lib) do (
    set "ANAND=%%S\src\main\java\com\anandpharmacy"
    if exist "!ANAND!" (
        echo   Removing: !ANAND!
        rmdir /s /q "!ANAND!"
    ) else (
        echo   OK - not found: !ANAND!
    )
)

echo.
echo [STEP 2] Removing stray com\pharmacy\common inside services (not common-lib)...
echo.

for %%S in (api-gateway auth-service product-service cart-service order-service payment-service) do (
    set "STRAY=%%S\src\main\java\com\pharmacy\common"
    if exist "!STRAY!" (
        echo   Removing stray: !STRAY!
        rmdir /s /q "!STRAY!"
    ) else (
        echo   OK - not found: !STRAY!
    )
)

echo.
echo [STEP 3] Building and installing common-lib to local Maven cache...
echo.
call .\mvnw.cmd clean install -pl common-lib -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: common-lib build failed! See above output.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [STEP 4] Verifying JAR installed correctly...
if exist "%USERPROFILE%\.m2\repository\com\pharmacy\common-lib\1.0.0\common-lib-1.0.0.jar" (
    echo   SUCCESS: common-lib-1.0.0.jar is in local Maven cache.
) else (
    echo   WARNING: JAR not found - check Maven output above.
)

echo.
echo ==========================================================
echo  ALL DONE! Next steps:
echo    1. Run .\run.ps1 to start your services
echo    2. In VS Code: Ctrl+Shift+P ^>
echo       "Java: Clean Java Language Server Workspace"
echo       ^> "Restart and delete"
echo ==========================================================
echo.
pause
