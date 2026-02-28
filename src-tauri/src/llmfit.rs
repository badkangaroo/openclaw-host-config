//! llmfit integration: system specs and model recommendations.
//! See https://github.com/AlexsJones/llmfit

use serde::{Deserialize, Serialize};
use std::process::Command;

/// Runs `llmfit --json system` and parses JSON. Returns None if llmfit not installed or fails.
#[must_use]
pub fn get_llmfit_system() -> Option<LlmfitSystemJson> {
    let out = Command::new("llmfit")
        .args(["--json", "system"])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let body = String::from_utf8_lossy(&out.stdout);
    serde_json::from_str(&body).ok()
}

/// Runs `llmfit recommend --json --limit N` and parses JSON. Returns empty vec if llmfit fails.
#[must_use]
pub fn get_llmfit_recommendations(limit: u8) -> Vec<LlmfitRecommendation> {
    get_llmfit_recommendations_inner(limit).unwrap_or_default()
}

fn get_llmfit_recommendations_inner(limit: u8) -> Option<Vec<LlmfitRecommendation>> {
    let limit = limit.min(20).max(1);
    let out = Command::new("llmfit")
        .args(["recommend", "--json", "--limit", &limit.to_string()])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let body = String::from_utf8_lossy(&out.stdout);
    serde_json::from_str(&body).ok()
}

// --- JSON shapes (subset of llmfit output; we only need a few fields) ---

/// llmfit system JSON; field names may vary by llmfit version.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct LlmfitSystemJson {
    #[serde(alias = "total_ram_gb", alias = "total_ram")]
    pub total_ram_gb: Option<f64>,
    #[serde(alias = "available_ram_gb", alias = "available_ram")]
    pub available_ram_gb: Option<f64>,
    pub cpu_cores: Option<u32>,
    pub gpu_name: Option<String>,
    pub vram_gb: Option<f64>,
    pub backend: Option<String>,
}

impl Default for LlmfitSystemJson {
    fn default() -> Self {
        Self {
            total_ram_gb: None,
            available_ram_gb: None,
            cpu_cores: None,
            gpu_name: None,
            vram_gb: None,
            backend: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct LlmfitRecommendation {
    pub name: Option<String>,
    #[serde(alias = "params_b", alias = "params")]
    pub params_b: Option<f64>,
    pub fit: Option<String>,
    pub score: Option<f64>,
    pub use_case: Option<String>,
    pub mem_gb: Option<f64>,
}

impl Default for LlmfitRecommendation {
    fn default() -> Self {
        Self {
            name: None,
            params_b: None,
            fit: None,
            score: None,
            use_case: None,
            mem_gb: None,
        }
    }
}

