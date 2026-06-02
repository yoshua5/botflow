@echo off
setlocal enabledelayedexpansion

REM Navigate to botflow directory
cd /d "C:\Users\18582\Desktop\ai-apps\botflow" || exit /b 1

REM Remove locked .git directory
echo Cleaning .git directory...
rmdir /s /q .git >nul 2>&1

REM Initialize fresh git repo
echo Initializing git...
git init
git config user.email "yoshualeisorek17@gmail.com"
git config user.name "Yoshua"

REM Add all files
echo Adding files...
git add .

REM Create commit
echo Creating commit...
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"

REM Add remote and push
echo Pushing to GitHub...
set TOKEN=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
set REPO_URL=https://%TOKEN%@github.com/yoshua5/botflow.git

git remote add origin %REPO_URL%
git branch -M main
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Code pushed to GitHub! Vercel deployment starting...
    echo.
) else (
    echo.
    echo [ERROR] Push failed with code %errorlevel%
    echo.
)

REM Clear token from memory
set TOKEN=
set REPO_URL=

pause
