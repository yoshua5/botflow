@echo off
cd /d "C:\Users\18582\Desktop\ai-apps\botflow"
echo Committing KB fix...
git add app/api/knowledge/route.js
git commit -m "Fix KB upload: pass userId to all storage functions"
echo Pushing to GitHub...
git push origin main
echo.
echo Done! Vercel will deploy automatically.
pause
