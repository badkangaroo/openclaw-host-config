# OpenClaw Local Host Config Tool

A CLI tool for managing and configuring local OpenClaw host setups.

## Features

- View current configuration status
- Manage gateway daemon settings (start/stop/restart)
- Configure model overrides per-session
- Set up API keys and credentials securely
- Monitor resource usage and performance metrics

## Usage

```bash
# Check current status
openclaw config status

# Start the gateway daemon
openclaw config start

# Stop the gateway daemon
openclaw config stop

# Restart with new settings
openclaw config restart

# View model configuration
openclaw config models

# Set default model override
openclaw config set-model <model-name>
```

## Tauri build (desktop app)

The project includes a Tauri 2 desktop app in `src-tauri/`. You can build it with scripts (recommended) or manually.

### Build without intervention (recommended)

From the repo root, run:

```bash
# Install requirements (Rust, Tauri CLI, Node.js, platform deps) then build the app.
# Idempotent: safe to run multiple times.
./scripts/build.sh
```

This script will:

1. **Install requirements** (if missing): Rust (rustup), Tauri CLI, and Node.js 18+ (uses nvm/fnm if available). On Linux (Debian/Ubuntu) it installs Tauri system packages (`libwebkit2gtk-4.1-dev`, etc.). On macOS it checks for Xcode Command Line Tools.
2. **Install frontend dependencies** (`npm install`) and **build the frontend** to `dist/` (`npm run build`).
3. **Build the Tauri app** (`cargo tauri build`).

Output: `src-tauri/target/release/bundle/` (installers and binaries).

To only install requirements (no build):

```bash
./scripts/install-requirements.sh
```

### Manual build

**Prerequisites**

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) (v18+)
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** Microsoft C++ Build Tools and WebView2
- **Linux:** [Tauri deps](https://v2.tauri.app/start/prerequisites/) (e.g. `libwebkit2gtk-4.1-dev`, `build-essential`, etc.)

**Commands**

```bash
cargo install tauri-cli   # if not already installed
npm install && npm run build
cargo tauri dev          # development (dev server + hot reload)
cargo tauri build        # production (after frontend is in dist/)
```

## Configuration Files

- `~/.openclaw/config.yaml` - Main configuration file
- `~/.openclaw/models/` - Model registry and overrides
- `~/.openclaw/api-keys/` - Secure credential storage
