cd "C:\Users\18582\Desktop\ai-apps\botflow"

# Configure git
git config user.email "yoshualeisorek17@gmail.com"
git config user.name "Yoshua"

# Add changes and commit
git add .
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected"

# Push to main
git push origin main

Write-Host "✅ Pushed to GitHub! Vercel will auto-deploy."
