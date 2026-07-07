@echo off
echo ====================================================
echo             PHARMA-APP GIT PUSHER
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing Git if needed...
if not exist ".git" (
    git init
)

echo [2/5] Setting up remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/khuswanth1/Pharma-app.git

echo [3/5] Staging files...
git add .

echo [4/5] Committing changes...
git commit -m "first commit"

echo [5/5] Pushing to remote 'main' branch...
git branch -M main
git push -u origin main

echo.
echo ====================================================
echo Done!
echo.
pause
