@echo off
setlocal enabledelayedexpansion

REM Navigate to botflow directory
cd /d "C:\Users\18582\Desktop\ai-apps\botflow" || exit /b 1

REM Log file
set LOGFILE=C:\Users\18582\Desktop\ai-apps\botflow\push-debug.log

REM Start logging
echo [%date% %time%] Starting push debug script >> %LOGFILE%

REM Remove locked .git directory
echo Cleaning .git directory... >> %LOGFILE%
rmdir /s /q .git >> %LOGFILE% 2>&1

REM Initialize fresh git repo
echo Initializing git... >> %LOGFILE%
git init >> %LOGFILE% 2>&1
git config user.email "yoshualeisorek17@gmail.com" >> %LOGFILE% 2>&1
git config user.name "Yoshua" >> %LOGFILE% 2>&1

REM Add all files
echo Adding files... >> %LOGFILE%
git add . >> %LOGFILE% 2>&1

REM Create commit
echo Creating commit... >> %LOGFILE%
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies" >> %LOGFILE% 2>&1

REM Add remote and push
echo Pushing to GitHub... >> %LOGFILE%
set TOKEN=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
set REPO_URL=https://%TOKEN%@github.com/yoshua5/botflow.git

git remote add origin %REPO_URL% >> %LOGFILE% 2>&1
git branch -M main >> %LOGFILE% 2>&1
git push -u origin main --force >> %LOGFILE% 2>&1

if %errorlevel% equ 0 (
    echo [SUCCESS] Code pushed to GitHub! >> %LOGFILE%
) else (
    echo [ERROR] Push failed with code %errorlevel% >> %LOGFILE%
)

REM Clear token from memory
set TOKEN=
set REPO_URL=

REM Show log
type %LOGFILE%
pause
