use serde::Serialize;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

fn http_client() -> &'static reqwest::Client {
    use std::sync::OnceLock;
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
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

    parse_rss_feed(&content[..])
}

fn audio_cache_dir() -> PathBuf {
    std::env::temp_dir().join("English Immerser")
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
pub fn allow_media_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.asset_protocol_scope()
        .allow_file(path)
        .map_err(|e| format!("Failed to allow media file: {}", e))
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

fn parse_rss_feed(content: &[u8]) -> Result<PodcastFeed, String> {
    let channel = rss::Channel::read_from(content)
        .map_err(|e| format!("Failed to parse RSS: {}", e))?;
    Ok(build_podcast_feed(&channel))
}

fn build_podcast_feed(channel: &rss::Channel) -> PodcastFeed {
    let items = channel
        .items()
        .iter()
        .filter_map(|item| {
            let audio_url = extract_audio_url(item)?;

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

    PodcastFeed {
        title: channel.title().to_string(),
        description: channel.description().to_string(),
        items,
    }
}

fn extract_audio_url(item: &rss::Item) -> Option<String> {
    item
        .extensions()
        .get("ppg")
        .and_then(|m| m.get("enclosureSecure"))
        .and_then(|exts| exts.first())
        .and_then(|ext| ext.attrs().get("url"))
        .cloned()
        .or_else(|| item.enclosure().map(|e| e.url().to_string()))
        .or_else(|| {
            item.extensions()
                .get("media")
                .and_then(|m| m.get("content"))
                .and_then(|exts| exts.first())
                .and_then(|ext| ext.attrs().get("url"))
                .cloned()
        })
}

#[cfg(test)]
mod tests {
    use super::{build_podcast_feed, parse_rss_feed};

    #[test]
    fn parses_standard_enclosure_items() {
        let raw = br#"
            <rss version="2.0">
              <channel>
                <title>Test Feed</title>
                <description>Feed description</description>
                <item>
                  <title>Episode 1</title>
                  <description>Episode description</description>
                  <enclosure url="https://example.com/episode1.mp3" length="123" type="audio/mpeg" />
                  <itunes:duration xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">12:34</itunes:duration>
                  <pubDate>Mon, 24 May 2026 08:30:00 GMT</pubDate>
                </item>
              </channel>
            </rss>
        "#;

        let feed = parse_rss_feed(raw).expect("feed should parse");
        assert_eq!(feed.title, "Test Feed");
        assert_eq!(feed.description, "Feed description");
        assert_eq!(feed.items.len(), 1);
        assert_eq!(feed.items[0].audio_url, "https://example.com/episode1.mp3");
        assert_eq!(feed.items[0].duration.as_deref(), Some("12:34"));
        assert_eq!(
            feed.items[0].pub_date.as_deref(),
            Some("Mon, 24 May 2026 08:30:00 GMT"),
        );
    }

    #[test]
    fn prefers_secure_enclosure_over_regular_enclosure() {
        let raw = br#"
            <rss version="2.0" xmlns:ppg="https://example.com/ppg">
              <channel>
                <title>Secure Feed</title>
                <description>Secure description</description>
                <item>
                  <title>Episode 2</title>
                  <description>Episode 2 description</description>
                  <enclosure url="http://example.com/episode2.mp3" length="123" type="audio/mpeg" />
                  <ppg:enclosureSecure url="https://example.com/episode2.mp3" />
                </item>
              </channel>
            </rss>
        "#;

        let feed = parse_rss_feed(raw).expect("feed should parse");
        assert_eq!(feed.items[0].audio_url, "https://example.com/episode2.mp3");
    }

    #[test]
    fn builds_feed_from_channel() {
        let raw = br#"
            <rss version="2.0">
              <channel>
                <title>Channel Title</title>
                <description>Channel Description</description>
                <item>
                  <title>Episode 3</title>
                  <enclosure url="https://example.com/episode3.mp3" length="123" type="audio/mpeg" />
                </item>
              </channel>
            </rss>
        "#;

        let channel = rss::Channel::read_from(&raw[..]).expect("channel should parse");
        let feed = build_podcast_feed(&channel);
        assert_eq!(feed.title, "Channel Title");
        assert_eq!(feed.items[0].title, "Episode 3");
    }
}
