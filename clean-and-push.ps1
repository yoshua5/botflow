$token = "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"
$repoUrl = "https://$token@github.com/yoshua5/botflow.git"

cd "C:\Users\18582\Desktop\ai-apps\botflow"

# Reset last commit (keep files)
git reset --soft HEAD~1

# Remove sensitive files from staging
git restore --staged botflow-config.json test-anthropic.js

# Add .gitignore to prevent future commits
@"
.env
.env.local
botflow-config.json
test-anthropic.js
node_modules/
.next/
dist/
build/
"@ | Out-File -FilePath .gitignore -Encoding UTF8

git add .gitignore
git add .

# New clean commit
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"

# Set remote with token and push
git remote set-url origin $repoUrl
git branch -M main
git push -u origin main --force

Write-Host "✅ Pushed to GitHub! Vercel auto-deploying now..."

# Clear sensitive data
Remove-Variable token
$repoUrl = $null
