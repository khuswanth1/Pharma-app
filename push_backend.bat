@echo off
echo ====================================================
echo             BACKEND GIT PUSHER
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing Git if needed...
if not exist ".git" (
    git init
)

echo [2/5] Setting up remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/khuswanth1/Pharmacy.git

echo [3/5] Staging files...
git add .
git rm --cached auth-service/src/main/resources/application.yml >nul 2>&1

echo [4/5] Committing changes...
git commit -m "Backend Spring Boot with Google OAuth"

echo [5/5] Pushing to remote 'backend' branch...
git branch -M backend
git push -f -u origin backend

echo.
echo ====================================================
echo SUCCESS: Code pushed to 'backend' branch!
echo.
pause
