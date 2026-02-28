#!/usr/bin/env bash
# One-shot build for OpenClaw Config Tauri app.
# Installs requirements if needed, builds frontend, then runs cargo tauri build.
# Run from repo root: ./scripts/build.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Ensure cargo is on PATH (e.g. after rustup install in same session)
export PATH="${HOME}/.cargo/bin:${PATH}"
if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.cargo/env"
fi

log() { echo "[build] $*"; }

# 1. Install requirements (idempotent)
"$REPO_ROOT/scripts/install-requirements.sh"

# 2. Frontend deps and build
log "Installing frontend dependencies..."
npm install
log "Building frontend (dist/)..."
npm run build

# 3. Tauri build
# Normalize CI so tools that expect --ci true/false don't get invalid values (e.g. CI=1)
case "${CI:-}" in
  1|yes) export CI=true ;;
  true|false) ;;
  *) unset -v CI ;;
esac
log "Building Tauri app..."
cargo tauri build

log "Done. Artifacts in src-tauri/target/release/bundle/"
