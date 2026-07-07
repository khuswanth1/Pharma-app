@echo off
echo Staging all changes...
git add .

echo Committing changes...
git commit -m "first commit"

echo.
echo ===================================================
echo Select Push Method:
echo [1] Standard Push (Safe - might fail if remote has conflicting changes)
echo [2] Force Push (Overwrites remote GitHub repository with your local code)
echo ===================================================
echo.
set /p choice="Enter option (1 or 2): "

if "%choice%"=="2" (
    echo Force pushing to GitHub...
    git push -u origin main --force
) else (
    echo Pushing to GitHub...
    git push -u origin main
)

echo Done!
pause
