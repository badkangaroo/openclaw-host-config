#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = '~/.openclaw/config.yaml';

function getStatus() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH.replace('~', process.env.HOME || ''), 'utf-8'));
    console.log('OpenClaw Configuration Status:');
    console.log('Gateway:', config.gateway.enabled ? 'enabled' : 'disabled');
    console.log('Port:', config.gateway.port);
    console.log('Timeout:', config.gateway.timeout + 'ms');
  } catch (error) {
    console.log('No configuration found. Run "openclaw-config init" to create one.');
  }
}

function startGateway() {
  try {
    execSync('openclaw gateway start', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to start gateway:', error.message);
  }
}

function stopGateway() {
  try {
    execSync('openclaw gateway stop', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to stop gateway:', error.message);
  }
}

function restartGateway() {
  try {
    execSync('openclaw gateway restart', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to restart gateway:', error.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'status':
    getStatus();
    break;
  case 'start':
    startGateway();
    break;
  case 'stop':
    stopGateway();
    break;
  case 'restart':
    restartGateway();
    break;
  default:
    console.log('OpenClaw Host Config Tool');
    console.log('Usage: openclaw-config <command>');
    console.log('Commands: status, start, stop, restart');
}
