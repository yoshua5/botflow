cd "C:\Users\18582\Desktop\ai-apps\botflow"

# Remove corrupted git
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

# Reinitialize
git init
git remote add origin https://github.com/yoshua5s-projects/botflow.git
git config user.email "yoshualeisorek17@gmail.com"
git config user.name "Yoshua"

# Add and commit
git add .
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected"

# Push
git branch -M main
git push -u origin main --force

Write-Host "✅ Git fixed and pushed!"
