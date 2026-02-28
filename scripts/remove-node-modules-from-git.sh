#!/usr/bin/env bash
# One-time cleanup: remove node_modules from git tracking.
# Run this on a branch that has node_modules committed (e.g. origin/main).
# Dependencies should be managed via package.json and package-lock.json only.
set -e
cd "$(dirname "$0")/.."
COUNT=$(git ls-files --cached 'node_modules/' 2>/dev/null | wc -l)
if [ "$COUNT" -eq 0 ]; then
  echo "No node_modules files are tracked by git. Nothing to do."
  exit 0
fi
echo "Removing $COUNT tracked files under node_modules/ from git index..."
git rm -r --cached node_modules/
echo "Done. Commit with: git commit -m 'chore: remove node_modules from repository; use .gitignore and package.json only'"
echo "Then push to update the remote."
