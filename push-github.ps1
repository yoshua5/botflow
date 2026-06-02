# PowerShell script to initialize git, add files, commit, and push to GitHub

Set-Location "C:\Users\18582\Desktop\ai-apps\botflow"

# Initialize fresh git repo
Write-Host "Initializing git repository..."
git init
if ($LASTEXITCODE -ne 0) { Write-Host "Error initializing git"; exit 1 }

# Configure git
Write-Host "Configuring git..."
git config user.email "yoshualeisorek17@gmail.com"
git config user.name "Yoshua"

# Add all files
Write-Host "Adding files..."
git add .

# Create commit
Write-Host "Creating commit..."
git commit -m "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"
if ($LASTEXITCODE -ne 0) { Write-Host "Error committing"; exit 1 }

# Rename branch to main
Write-Host "Renaming branch to main..."
git branch -M main

# Add remote and push
Write-Host "Pushing to GitHub..."
$token = "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"
$repoUrl = "https://$($token)@github.com/yoshua5/botflow.git"

git remote add origin $repoUrl
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Code pushed to GitHub! Vercel deployment starting..."
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Push failed with code $LASTEXITCODE"
    Write-Host ""
}

# Clear token from memory
$token = ""
$repoUrl = ""
