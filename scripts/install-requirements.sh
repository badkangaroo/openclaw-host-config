#!/usr/bin/env bash
# Install requirements for building the OpenClaw Config Tauri app.
# Idempotent: safe to run multiple times. Run from repo root.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

log() { echo "[install-requirements] $*"; }
need_node_version=18

# --- Rust (rustup) ---
if ! command -v cargo &>/dev/null; then
  log "Installing Rust via rustup..."
  curl -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  export PATH="$HOME/.cargo/bin:$PATH"
else
  log "Rust already installed ($(cargo --version))."
fi

# Ensure cargo is on PATH for this script (e.g. after fresh rustup install)
if ! command -v cargo &>/dev/null; then
  export PATH="${HOME}/.cargo/bin:${PATH}"
  if ! command -v cargo &>/dev/null; then
    echo "Error: cargo not found. Add ~/.cargo/bin to PATH and re-run." >&2
    exit 1
  fi
fi

# --- Tauri CLI ---
if ! cargo tauri --version &>/dev/null; then
  log "Installing Tauri CLI..."
  cargo install tauri-cli
else
  log "Tauri CLI already installed."
fi

# --- Node.js ---
node_ok=
if command -v node &>/dev/null; then
  ver=$(node -v | sed -n 's/^v\([0-9]*\).*/\1/p')
  if [ -n "$ver" ] && [ "$ver" -ge "$need_node_version" ]; then
    node_ok=1
  fi
fi

if [ -z "$node_ok" ]; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    log "Using nvm to install Node.js $need_node_version..."
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
    nvm install "$need_node_version" || nvm install --lts
    nvm use "$need_node_version" || nvm use --lts
    node_ok=1
  elif command -v fnm &>/dev/null; then
    log "Using fnm to install Node.js $need_node_version..."
    fnm install --lts
    eval "$(fnm env)"
    node_ok=1
  fi
fi

if [ -z "$node_ok" ]; then
  echo "Node.js $need_node_version+ is required but not found (or version too old)." >&2
  echo "Install it from https://nodejs.org/ or use nvm/fnm and re-run this script." >&2
  exit 1
fi
log "Node.js OK ($(node -v))."

# --- Platform-specific ---
case "$(uname -s)" in
  Darwin)
    if ! xcode-select -p &>/dev/null; then
      echo "macOS: Xcode Command Line Tools are required. Run: xcode-select --install" >&2
      exit 1
    fi
    log "macOS: Xcode CLI tools OK."
    ;;
  Linux)
    if [ -r /etc/os-release ]; then
      # shellcheck source=/dev/null
      . /etc/os-release
      if command -v apt-get &>/dev/null && [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
        log "Installing Tauri dependencies (apt)..."
        sudo apt-get update -qq
        sudo apt-get install -y \
          libwebkit2gtk-4.1-dev \
          build-essential \
          curl \
          wget \
          file \
          libxdo-dev \
          libssl-dev \
          pkg-config \
          libayatana-appindicator3-dev \
          librsvg2-dev
        log "Linux dependencies OK."
      else
        log "Unsupported Linux distro ($ID). Install Tauri prerequisites manually: https://v2.tauri.app/start/prerequisites/"
      fi
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    log "Windows: ensure Microsoft C++ Build Tools and WebView2 are installed. See https://v2.tauri.app/start/prerequisites/"
    ;;
  *)
    log "Unsupported OS. Install Rust, Node $need_node_version+, and Tauri prerequisites manually."
    ;;
esac

log "Requirements OK. Run ./scripts/build.sh to build the app."
