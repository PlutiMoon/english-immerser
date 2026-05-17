use serde::Serialize;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;

fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

#[derive(Debug, Serialize)]
pub struct PodcastFeed {
    pub title: String,
    pub description: String,
    pub items: Vec<PodcastItem>,
}

#[derive(Debug, Serialize)]
pub struct PodcastItem {
    pub title: String,
    pub description: String,
    pub audio_url: String,
    pub duration: Option<String>,
    pub pub_date: Option<String>,
}

#[tauri::command]
pub async fn fetch_rss(url: String) -> Result<PodcastFeed, String> {
    let content = http_client()
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch RSS: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let channel = rss::Channel::read_from(&content[..])
        .map_err(|e| format!("Failed to parse RSS: {}", e))?;

    let items = channel
        .items()
        .iter()
        .filter_map(|item| {
            // Prefer HTTPS audio URL. BBC feeds provide ppg:enclosureSecure
            let audio_url = item
                .extensions()
                .get("ppg")
                .and_then(|m| m.get("enclosureSecure"))
                .and_then(|exts| exts.first())
                .and_then(|ext| ext.attrs().get("url"))
                .cloned()
                .or_else(|| {
                    item.enclosure().map(|e| e.url().to_string())
                })
                .or_else(|| {
                    item.extensions()
                        .get("media")
                        .and_then(|m| m.get("content"))
                        .and_then(|exts| exts.first())
                        .and_then(|ext| ext.attrs().get("url"))
                        .cloned()
                })?;

            Some(PodcastItem {
                title: item.title().unwrap_or("Untitled").to_string(),
                description: item
                    .description()
                    .unwrap_or("")
                    .chars()
                    .take(500)
                    .collect(),
                audio_url,
                duration: item
                    .itunes_ext()
                    .and_then(|it| it.duration().map(|d| d.to_string())),
                pub_date: item.pub_date().map(|d| d.to_string()),
            })
        })
        .collect();

    Ok(PodcastFeed {
        title: channel.title().to_string(),
        description: channel.description().to_string(),
        items,
    })
}

fn audio_cache_dir() -> PathBuf {
    std::env::temp_dir().join("英语一号")
}

#[tauri::command]
pub async fn download_audio(url: String) -> Result<String, String> {
    // Return cached path if already downloaded
    let filename = url
        .split('/')
        .last()
        .unwrap_or("audio.mp3")
        .split('?')
        .next()
        .unwrap_or("audio.mp3");
    if !filename.contains('.') {
        return Err("URL does not appear to be an audio file".into());
    }

    let cache_dir = audio_cache_dir();
    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache dir: {}", e))?;
    let dest = cache_dir.join(filename);

    // Return cached file if it exists and is non-empty
    if dest.exists() {
        if let Ok(meta) = std::fs::metadata(&dest) {
            if meta.len() > 0 {
                return Ok(dest.to_string_lossy().to_string());
            }
        }
    }

    // Download
    let response = http_client()
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Server returned {}", status));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    if bytes.is_empty() {
        return Err("Downloaded file is empty".into());
    }

    let mut file = std::fs::File::create(&dest)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_cache_dir() -> Result<(), String> {
    let path = audio_cache_dir().to_string_lossy().to_string();
    #[cfg(target_os = "windows")]
    {
        let path = path.replace('/', "\\");
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let path = path.replace('/', "\\");
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    Ok(())
}
