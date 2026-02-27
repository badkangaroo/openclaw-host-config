#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
struct Config {
    gateway: GatewayConfig,
    models: Vec<String>,
    api_keys: ApiKeys,
}

#[derive(Serialize, Deserialize)]
struct GatewayConfig {
    enabled: bool,
    port: u16,
    timeout: u32,
}

#[derive(Serialize, Deserialize)]
struct ApiKeys {
    helius: Option<String>,
    jupiter: Option<String>,
    firecrawl: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            gateway: GatewayConfig {
                enabled: true,
                port: 8080,
                timeout: 30000,
            },
            models: vec![],
            api_keys: ApiKeys {
                helius: None,
                jupiter: None,
                firecrawl: None,
            },
        }
    }
}

fn get_config_path() -> PathBuf {
    let home_dir = dirs::home_dir().unwrap();
    home_dir.join(".openclaw").join("config.json")
}

#[tauri::command]
fn get_status() -> Config {
    let config_path = get_config_path();
    
    if config_path.exists() {
        match fs::read_to_string(&config_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Config::default(),
        }
    } else {
        Config::default()
    }
}

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> {
    let config_path = get_config_path();
    
    match fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap()) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn start_gateway() -> Result<String, String> {
    // TODO: Actually execute openclaw gateway start command
    Ok("Gateway started successfully".to_string())
}

#[tauri::command]
fn stop_gateway() -> Result<String, String> {
    // TODO: Actually execute openclaw gateway stop command
    Ok("Gateway stopped successfully".to_string())
}

#[tauri::command]
fn add_model(model_name: String) -> Result<Vec<String>, String> {
    let config_path = get_config_path();
    
    if !config_path.exists() {
        return Err("Config file not found".to_string());
    }

    let content = fs::read_to_string(&config_path).unwrap();
    let mut config: Config = serde_json::from_str(&content).unwrap_or_default();
    
    config.models.push(model_name);
    
    match fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap()) {
        Ok(_) => Ok(config.models),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn save_api_key(service: String, key: String) -> Result<(), String> {
    let config_path = get_config_path();
    
    if !config_path.exists() {
        return Err("Config file not found".to_string());
    }

    let content = fs::read_to_string(&config_path).unwrap();
    let mut config: Config = serde_json::from_str(&content).unwrap_or_default();
    
    match service.as_str() {
        "helius" => config.api_keys.helius = Some(key),
        "jupiter" => config.api_keys.jupiter = Some(key),
        "firecrawl" => config.api_keys.firecrawl = Some(key),
        _ => return Err("Unknown service".to_string()),
    }
    
    match fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap()) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_status,
            save_config,
            start_gateway,
            stop_gateway,
            add_model,
            save_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}