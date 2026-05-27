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

// ============================================================
// YouTube support (requires yt-dlp in PATH)
// ============================================================

fn yt_dlp_path() -> Result<String, String> {
    which::which("yt-dlp")
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|_| "yt-dlp 未安装。请运行 pip install yt-dlp 或 winget install yt-dlp 安装后重试。".to_string())
}

#[derive(Debug, serde::Serialize)]
pub struct YouTubeInfo {
    pub title: String,
    pub duration: u64,
    pub uploader: String,
    pub audio_url: String,
    pub subtitles: Vec<YouTubeSubtitle>,
}

#[derive(Debug, serde::Serialize)]
pub struct YouTubeSubtitle {
    pub lang: String,
    pub label: String,
}

#[tauri::command]
pub async fn fetch_youtube(url: String) -> Result<YouTubeInfo, String> {
    let ytdlp = yt_dlp_path()?;

    // Step 1: get metadata JSON
    let output = std::process::Command::new(&ytdlp)
        .args(["-j", "--no-playlist", "--flat-playlist", &url])
        .output()
        .map_err(|e| format!("无法启动 yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp 解析失败: {}", stderr.lines().last().unwrap_or("未知错误")));
    }

    let meta: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("解析 yt-dlp 输出失败: {}", e))?;

    let title = meta["title"].as_str().unwrap_or("未知标题").to_string();
    let duration = meta["duration"].as_u64().unwrap_or(0);
    let uploader = meta["uploader"].as_str()
        .or_else(|| meta["channel"].as_str())
        .unwrap_or("未知作者")
        .to_string();

    // Step 2: get audio stream URL (best audio-only format)
    let audio_output = std::process::Command::new(&ytdlp)
        .args(["-f", "bestaudio", "-g", "--no-playlist", &url])
        .output()
        .map_err(|e| format!("无法获取音频流: {}", e))?;

    let audio_url = String::from_utf8_lossy(&audio_output.stdout)
        .lines()
        .last()
        .unwrap_or("")
        .trim()
        .to_string();

    if audio_url.is_empty() {
        return Err("未能获取音频流地址".to_string());
    }

    // Step 3: collect available subtitles
    let mut subtitles: Vec<YouTubeSubtitle> = Vec::new();
    if let Some(subs) = meta["subtitles"].as_object() {
        for (lang, entries) in subs {
            if let Some(arr) = entries.as_array() {
                if !arr.is_empty() {
                    let label = lang_label(lang);
                    subtitles.push(YouTubeSubtitle { lang: lang.clone(), label });
                }
            }
        }
    }
    // Also check automatic captions
    if let Some(auto) = meta["automatic_captions"].as_object() {
        for (lang, entries) in auto {
            if let Some(arr) = entries.as_array() {
                if !arr.is_empty() && !subtitles.iter().any(|s| s.lang == *lang) {
                    let label = format!("{} (自动)", lang_label(lang));
                    subtitles.push(YouTubeSubtitle { lang: lang.clone(), label });
                }
            }
        }
    }

    Ok(YouTubeInfo { title, duration, uploader, audio_url, subtitles })
}

#[tauri::command]
pub async fn fetch_youtube_subtitle(url: String, lang: String) -> Result<Vec<SubtitleLine>, String> {
    let ytdlp = yt_dlp_path()?;

    // Write subtitles to a temp file, then read and parse
    let tmp_dir = std::env::temp_dir().join("english-immerser-yt");
    std::fs::create_dir_all(&tmp_dir).map_err(|e| format!("无法创建临时目录: {}", e))?;

    let output = std::process::Command::new(&ytdlp)
        .args([
            "--write-subs", "--write-auto-subs",
            "--sub-lang", &lang,
            "--sub-format", "vtt",
            "--skip-download",
            "-o", &format!("{}/%(id)s", tmp_dir.to_string_lossy()),
            &url,
        ])
        .output()
        .map_err(|e| format!("yt-dlp 字幕提取失败: {}", e))?;

    if !output.status.success() {
        return Err("字幕下载失败，该语言可能无可用字幕".to_string());
    }

    // Find the downloaded VTT file
    let vtt_files: Vec<_> = std::fs::read_dir(&tmp_dir)
        .map_err(|e| format!("读取临时目录失败: {}", e))?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "vtt"))
        .collect();

    if vtt_files.is_empty() {
        return Err("未找到字幕文件".to_string());
    }

    let vtt_path = vtt_files[0].path();
    let content = std::fs::read_to_string(&vtt_path)
        .map_err(|e| format!("读取字幕文件失败: {}", e))?;

    // Clean up
    let _ = std::fs::remove_file(&vtt_path);

    let lines = parse_vtt_content(&content);
    if lines.is_empty() {
        return Err("字幕内容为空".to_string());
    }

    Ok(lines)
}

fn lang_label(code: &str) -> String {
    match code.split('-').next().unwrap_or(code) {
        "en" => "English".into(),
        "zh" => "中文".into(),
        "ja" => "日本語".into(),
        "ko" => "한국어".into(),
        "fr" => "Français".into(),
        "de" => "Deutsch".into(),
        "es" => "Español".into(),
        "pt" => "Português".into(),
        "ru" => "Русский".into(),
        "ar" => "العربية".into(),
        other => other.to_uppercase(),
    }
}

#[derive(Debug, serde::Serialize)]
pub struct SubtitleLine {
    pub start: f64,
    pub end: f64,
    pub text: String,
}

fn parse_vtt_content(content: &str) -> Vec<SubtitleLine> {
    let mut lines: Vec<SubtitleLine> = Vec::new();
    let mut in_cue = false;
    let mut current_start: f64 = 0.0;
    let mut current_end: f64 = 0.0;
    let mut current_text = String::new();

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            if in_cue && !current_text.is_empty() {
                lines.push(SubtitleLine {
                    start: current_start,
                    end: current_end,
                    text: current_text.trim().to_string(),
                });
                current_text.clear();
            }
            in_cue = false;
            continue;
        }
        if line == "WEBVTT" || line.starts_with("NOTE") || line.starts_with("Kind:") || line.starts_with("Language:") {
            continue;
        }
        // Timecode line: "00:00:01.000 --> 00:00:04.000"
        if line.contains("-->") {
            in_cue = true;
            current_text.clear();
            let parts: Vec<&str> = line.split("-->").collect();
            if parts.len() == 2 {
                current_start = parse_vtt_timestamp(parts[0].trim());
                current_end = parse_vtt_timestamp(parts[1].trim());
            }
        } else if in_cue {
            if !current_text.is_empty() { current_text.push('\n'); }
            // Strip VTT tags like <c> <00:00:01.000>
            let clean = line.replace(|c: char| c == '<' || c == '>', "");
            let clean = clean.split('<').next().unwrap_or(&clean).trim().to_string();
            if !clean.is_empty() {
                current_text.push_str(&clean);
            }
        }
    }
    // Flush last cue
    if in_cue && !current_text.is_empty() {
        lines.push(SubtitleLine { start: current_start, end: current_end, text: current_text.trim().to_string() });
    }
    lines
}

fn parse_vtt_timestamp(s: &str) -> f64 {
    // "00:00:01.000" or "00:01.000"
    let s = s.trim();
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() == 3 {
        let h: f64 = parts[0].parse().unwrap_or(0.0);
        let m: f64 = parts[1].parse().unwrap_or(0.0);
        let secs: f64 = parts[2].parse().unwrap_or(0.0);
        h * 3600.0 + m * 60.0 + secs
    } else if parts.len() == 2 {
        let m: f64 = parts[0].parse().unwrap_or(0.0);
        let secs: f64 = parts[1].parse().unwrap_or(0.0);
        m * 60.0 + secs
    } else {
        s.parse().unwrap_or(0.0)
    }
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
