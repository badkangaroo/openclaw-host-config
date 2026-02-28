# OpenClaw Local Host Config Tool

A CLI tool for managing and configuring local OpenClaw host setups.

## Features

- View current configuration status
- Manage gateway daemon settings (start/stop/restart)
- Configure model overrides per-session
- Set up API keys and credentials securely
- Monitor resource usage and performance metrics
- **Local LLMs tab:** Detect Ollama, LM Studio, and vLLM (installed + running), list models available on each runtime, show system RAM
- **llmfit integration:** If [llmfit](https://github.com/AlexsJones/llmfit) is installed (`cargo install llmfit`), show hardware specs and model recommendations that fit your system
- **OpenClaw tab:** Read and edit `~/.openclaw/openclaw.json`: show **models.providers** (ollama, lmstudio, nvidia-nim, anthropic, etc.), **agents.defaults.model.primary** (dropdown), **agents.defaults.models** (allowlist), **maxConcurrent**, and **subagents** (maxConcurrent, maxSpawnDepth, maxChildrenPerAgent)
- **Agents tab:** List agents from `~/.openclaw/agents/` (e.g. main, dev). Per-agent: view **agent/agent/models.json** (providers with baseUrl, apiKey, api, models). **Sync status** vs openclaw.json’s models.providers; **Update** button copies openclaw’s provider list into the agent’s models.json (keeps existing apiKey when merging).

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

## Testing

Backend logic is split into testable modules under `src-tauri/src/`:

- **detection.rs** — LLM runtime detection (Ollama, LM Studio, vLLM). Unit tests: `parse_version_line`, `port_open`.
- **system.rs** — System RAM via `sysinfo`. Unit tests: `bytes_to_human`, `get_system_info`.
- **models_available.rs** — Ollama `/api/tags` and LM Studio `lms ls`. Unit tests: `parse_ollama_tags_json`, `parse_lm_studio_ls_output`.
- **openclaw_config.rs** — Read/write `~/.openclaw/openclaw.json`; present `models.providers`, `agents.defaults.model`, `maxConcurrent`, `subagents`. Unit tests: `parse_config_view` (required fields), `get_openclaw_config` (no panic).

Run Rust tests:

```bash
cd src-tauri && cargo test
```

Each Tauri command is a thin wrapper over these modules, so testing the modules covers the behaviour. The **llmfit** integration runs the `llmfit` binary when present; no unit tests for that (optional dependency).

## Configuration Files

- `~/.openclaw/config.yaml` - Main configuration file
- `~/.openclaw/models/` - Model registry and overrides
- `~/.openclaw/api-keys/` - Secure credential storage
