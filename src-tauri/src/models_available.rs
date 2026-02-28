//! Fetch list of models available on each runtime (Ollama, LM Studio).
//! Parsing is separated for unit tests.

use serde::Deserialize;
use std::process::Command;

use crate::detection;

const OLLAMA_TAGS_URL: &str = "http://127.0.0.1:11434/api/tags";

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Option<Vec<OllamaModel>>,
}

#[derive(Deserialize)]
struct OllamaModel {
    name: Option<String>,
}

/// Parses Ollama /api/tags JSON and returns model names.
/// Input is the raw response body.
#[must_use]
pub fn parse_ollama_tags_json(body: &str) -> Vec<String> {
    let resp: OllamaTagsResponse = match serde_json::from_str(body) {
        Ok(r) => r,
        Err(_) => return vec![],
    };
    let models = match resp.models {
        Some(m) => m,
        None => return vec![],
    };
    models
        .into_iter()
        .filter_map(|m| m.name)
        .filter(|s| !s.is_empty())
        .collect()
}

/// Fetches model list from Ollama API. Returns empty vec if not running or request fails.
#[must_use]
pub fn get_ollama_models() -> Vec<String> {
    let resp = ureq::get(OLLAMA_TAGS_URL)
        .timeout(std::time::Duration::from_secs(2))
        .call();
    match resp {
        Ok(r) => {
            let body = r.into_string().unwrap_or_default();
            parse_ollama_tags_json(&body)
        }
        Err(_) => vec![],
    }
}

/// Parses `lms ls` output: one model name per line (or tab-separated).
/// Blank lines and whitespace-only lines are skipped.
#[must_use]
pub fn parse_lm_studio_ls_output(stdout: &str) -> Vec<String> {
    stdout
        .lines()
        .flat_map(|line| line.split('\t'))
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect()
}

/// Returns model names from LM Studio CLI (`lms ls`).
/// Requires LM Studio CLI in PATH or at ~/.lmstudio/bin/lms.
#[must_use]
pub fn get_lm_studio_models() -> Vec<String> {
    let cmd = detection::lms_path().unwrap_or_else(|| "lms".to_string());
    let out = Command::new(&cmd).args(["ls"]).output().ok();
    let output = match out {
        Some(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).to_string(),
        _ => return vec![],
    };
    parse_lm_studio_ls_output(&output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ollama_tags_json() {
        let json = r#"{"models":[{"name":"llama3.2"},{"name":"qwen2.5:7b"}]}"#;
        let names = parse_ollama_tags_json(json);
        assert_eq!(names, ["llama3.2", "qwen2.5:7b"]);

        let empty = r#"{"models":[]}"#;
        assert!(parse_ollama_tags_json(empty).is_empty());

        let missing = r#"{}"#;
        assert!(parse_ollama_tags_json(missing).is_empty());

        let invalid = "not json";
        assert!(parse_ollama_tags_json(invalid).is_empty());
    }

    #[test]
    fn test_parse_lm_studio_ls_output() {
        let out = "model-a\nmodel-b\nmodel-c";
        assert_eq!(
            parse_lm_studio_ls_output(out),
            ["model-a", "model-b", "model-c"]
        );

        let with_blanks = "a\n\nb\n  \nc";
        assert_eq!(parse_lm_studio_ls_output(with_blanks), ["a", "b", "c"]);

        let empty = "";
        assert!(parse_lm_studio_ls_output(empty).is_empty());
    }
}
