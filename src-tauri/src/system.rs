//! System information (RAM, etc.) for hardware-aware model selection.

use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    /// Total physical RAM in bytes.
    pub total_memory_bytes: u64,
    /// Usable/available physical RAM in bytes (approximate).
    pub available_memory_bytes: u64,
    /// Total memory as human-readable string (e.g. "16.0 GB").
    pub total_memory_human: String,
    /// Available memory as human-readable string.
    pub available_memory_human: String,
}

/// Returns total and available system RAM.
/// Refreshes system info once; safe to call repeatedly.
#[must_use]
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_memory();

    let total = sys.total_memory();
    let available = sys.available_memory();

    SystemInfo {
        total_memory_bytes: total,
        available_memory_bytes: available,
        total_memory_human: bytes_to_human(total),
        available_memory_human: bytes_to_human(available),
    }
}

/// Converts byte count to a short human string (e.g. "16.0 GB").
#[must_use]
pub fn bytes_to_human(bytes: u64) -> String {
    const GB: u64 = 1024 * 1024 * 1024;
    const MB: u64 = 1024 * 1024;
    const KB: u64 = 1024;
    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bytes_to_human() {
        assert_eq!(bytes_to_human(0), "0 B");
        assert_eq!(bytes_to_human(1023), "1023 B");
        assert_eq!(bytes_to_human(1536), "1.5 KB");
        assert_eq!(bytes_to_human(1024 * 1024), "1.0 MB");
        assert_eq!(bytes_to_human(2 * 1024 * 1024 * 1024), "2.0 GB");
        assert_eq!(bytes_to_human(16 * 1024 * 1024 * 1024), "16.0 GB");
    }

    #[test]
    fn test_get_system_info_no_panic() {
        let info = get_system_info();
        assert!(info.total_memory_bytes > 0, "total memory should be positive");
        assert!(
            info.available_memory_bytes <= info.total_memory_bytes,
            "available should not exceed total"
        );
        assert!(!info.total_memory_human.is_empty());
        assert!(!info.available_memory_human.is_empty());
    }
}
