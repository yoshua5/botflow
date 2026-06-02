cd "C:\Users\18582\Desktop\ai-apps\botflow"

# Update remote URL
git remote set-url origin https://github.com/yoshua5/botflow.git

# Add and commit
git add .
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"

# Push to main
git branch -M main
git push -u origin main --force

Write-Host "✅ Pushed to GitHub! Vercel auto-deploying now..."
