#!/usr/bin/env node

/**
 * OpenClaw Local Host Configuration Tool
 * Main entry point for configuration management
 */

import { readFileSync, writeFileSync } from 'fs';
const CONFIG_PATH = '~/.openclaw/config.json';

interface Config {
  gateway: {
    enabled: boolean;
    port: number;
    timeout?: number;
  };
  models: Record<string, string>;
  apiKeys: Record<string, string>;
}

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      const content = readFileSync(CONFIG_PATH.replace('~', process.env.HOME || ''), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.log('No config found. Creating default...');
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): Config {
    return {
      gateway: {
        enabled: true,
        port: 8080,
        timeout: 30000
      },
      models: {},
      apiKeys: {}
    };
  }

  save() {
    writeFileSync(CONFIG_PATH.replace('~', process.env.HOME || ''), JSON.stringify(this.config, null, 2));
    console.log('✓ Configuration saved');
  }

  getStatus() {
    return this.config;
  }

  setModel(name: string, value: string) {
    this.config.models[name] = value;
    this.save();
  }

  getApiKey(service: string): string | null {
    return this.config.apiKeys[service] || null;
  }

  setApiKey(service: string, key: string) {
    this.config.apiKeys[service] = key;
    this.save();
  }
}

export default ConfigManager;
