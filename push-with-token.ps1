$token = "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"
$repoUrl = "https://$token@github.com/yoshua5/botflow.git"

cd "C:\Users\18582\Desktop\ai-apps\botflow"

# Configure git
git config user.email "yoshualeisorek17@gmail.com"
git config user.name "Yoshua"

# Add and commit
git add .
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"

# Set remote with token and push
git remote set-url origin $repoUrl
git branch -M main
git push -u origin main --force

Write-Host "✅ Pushed to GitHub! Vercel auto-deploying now..."

# Clear sensitive data from memory
Remove-Variable token
$repoUrl = $null
