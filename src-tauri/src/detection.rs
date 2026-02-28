//! Local LLM runtime detection (Ollama, LM Studio, vLLM).
//! Parsing and pure logic are separated for unit testing.

use serde::{Deserialize, Serialize};
use std::net::{SocketAddr, TcpStream};
use std::process::Command;
use std::time::Duration;

#[derive(Clone, Serialize, Deserialize)]
pub struct LLMStatus {
    pub installed: bool,
    pub running: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct LocalLLMDetection {
    pub ollama: LLMStatus,
    pub lm_studio: LLMStatus,
    pub vllm: LLMStatus,
}

/// Parses the first non-empty line of command stdout as a version/identifier.
/// Used by Ollama and LM Studio version detection.
#[must_use]
pub fn parse_version_line(stdout: &str) -> Option<String> {
    let s = stdout.trim();
    if s.is_empty() {
        return None;
    }
    Some(s.lines().next()?.trim().to_string())
}

/// Returns true if something is listening on host:port (TCP).
pub fn port_open(host: &str, port: u16) -> bool {
    let addr = format!("{}:{}", host, port);
    addr.parse::<SocketAddr>()
        .ok()
        .and_then(|a| TcpStream::connect_timeout(&a, Duration::from_millis(500)).ok())
        .is_some()
}

/// Runs `command -v CMD` (Unix) or `where CMD` (Windows) and returns the first path line.
pub fn command_exists(cmd: &str) -> Option<String> {
    let out = if cfg!(target_os = "windows") {
        Command::new("where").args([cmd]).output().ok()?
    } else {
        Command::new("sh")
            .args(["-c", &format!("command -v {}", cmd)])
            .output()
            .ok()?
    };
    if out.status.success() {
        let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if path.is_empty() {
            None
        } else {
            Some(path.lines().next()?.to_string())
        }
    } else {
        None
    }
}

/// Path to LM Studio CLI if installed under ~/.lmstudio/bin.
#[must_use]
pub fn lms_path() -> Option<String> {
    let home = dirs::home_dir()?;
    let name = if cfg!(target_os = "windows") {
        "lms.exe"
    } else {
        "lms"
    };
    let p = home.join(".lmstudio").join("bin").join(name);
    if p.exists() {
        p.to_str().map(String::from)
    } else {
        None
    }
}

pub fn detect_ollama() -> LLMStatus {
    let path = command_exists("ollama");
    let installed = path.is_some();
    let running = port_open("127.0.0.1", 11434);
    let version = if installed {
        Command::new("ollama")
            .args(["--version"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| parse_version_line(&String::from_utf8_lossy(&o.stdout)))
    } else {
        None
    };
    LLMStatus {
        installed,
        running,
        version,
        path,
    }
}

pub fn detect_lm_studio() -> LLMStatus {
    let path = lms_path().or_else(|| command_exists("lms"));
    let installed = path.is_some();
    let running = port_open("127.0.0.1", 1234);
    let version = if installed {
        let cmd = path.as_ref().map(String::as_str).unwrap_or("lms");
        Command::new(cmd)
            .args(["--version"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .and_then(|o| parse_version_line(&String::from_utf8_lossy(&o.stdout)))
    } else {
        None
    };
    LLMStatus {
        installed,
        running,
        version,
        path,
    }
}

pub fn detect_vllm() -> LLMStatus {
    let out = Command::new("python3")
        .args(["-c", "import vllm; print(getattr(vllm, '__version__', 'unknown'))"])
        .output()
        .or_else(|_| {
            Command::new("python")
                .args(["-c", "import vllm; print(getattr(vllm, '__version__', 'unknown'))"])
                .output()
        })
        .ok();
    let (installed, version) = match out {
        Some(o) if o.status.success() => {
            let v = String::from_utf8_lossy(&o.stdout).trim().to_string();
            (true, if v.is_empty() { None } else { Some(v) })
        }
        _ => (false, None),
    };
    let running = port_open("127.0.0.1", 8000);
    LLMStatus {
        installed,
        running,
        version,
        path: None,
    }
}

pub fn detect_local_llms() -> LocalLLMDetection {
    LocalLLMDetection {
        ollama: detect_ollama(),
        lm_studio: detect_lm_studio(),
        vllm: detect_vllm(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_version_line() {
        assert_eq!(parse_version_line("ollama version 0.1.2"), Some("ollama version 0.1.2".into()));
        assert_eq!(parse_version_line("0.1.2\nnext"), Some("0.1.2".into()));
        assert_eq!(parse_version_line("  spaced  "), Some("spaced".into()));
        assert_eq!(parse_version_line(""), None);
        assert_eq!(parse_version_line("\n\n"), Some("".into()));
    }

    #[test]
    fn test_port_open_closed() {
        // Port 0 is invalid for connect; use a high port that's very unlikely to be in use.
        assert!(!port_open("127.0.0.1", 65432));
    }
}
