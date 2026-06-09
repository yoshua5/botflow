@echo off
cd /d "C:\Users\18582\Desktop\ai-apps\botflow"
echo Committing storage.js fixes...
git add lib/storage.js
git commit -m "Fix storage: add description field to KB index mapping and upsert"
echo Pushing to GitHub...
git push origin main
echo.
echo Done!
pause
