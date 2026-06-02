#!/usr/bin/env python3
import subprocess
import sys
import os
import shutil

botflow_dir = r"C:\Users\18582\Desktop\ai-apps\botflow"
os.chdir(botflow_dir)

try:
    # Remove existing .git
    if os.path.exists(".git"):
        shutil.rmtree(".git", ignore_errors=True)
        print("Removed existing .git directory")

    print("Initializing git repository...")
    subprocess.run(["git", "init"], check=True, timeout=10)

    print("Configuring git...")
    subprocess.run(["git", "config", "user.email", "yoshualeisorek17@gmail.com"], check=True, timeout=10)
    subprocess.run(["git", "config", "user.name", "Yoshua"], check=True, timeout=10)

    print("Adding files...")
    subprocess.run(["git", "add", "."], check=True, timeout=30)

    print("Creating commit...")
    subprocess.run(["git", "commit", "-m", "Enable RLS multi-tenancy security - all 11 tables protected with auth policies"], check=True, timeout=30)

    print("Renaming branch to main...")
    subprocess.run(["git", "branch", "-M", "main"], check=True, timeout=10)

    print("Adding remote...")
    token = "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"
    repo_url = f"https://{token}@github.com/yoshua5/botflow.git"
    subprocess.run(["git", "remote", "add", "origin", repo_url], check=True, timeout=10)

    print("Pushing to GitHub...")
    result = subprocess.run(["git", "push", "-u", "origin", "main", "--force"],
                          capture_output=True, text=True, timeout=60)

    if result.returncode == 0:
        print("")
        print("[SUCCESS] Code pushed to GitHub!")
        print("")
        sys.exit(0)
    else:
        print("")
        print("[ERROR] Push failed")
        print(result.stderr)
        print("")
        sys.exit(1)

except subprocess.TimeoutExpired:
    print("[ERROR] Command timed out")
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"[ERROR] Command failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
