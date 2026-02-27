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

## Configuration Files

- `~/.openclaw/config.yaml` - Main configuration file
- `~/.openclaw/models/` - Model registry and overrides
- `~/.openclaw/api-keys/` - Secure credential storage
