use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::fs;
use std::path::{Path, PathBuf};

const MAX_IMAGE_BYTES: u64 = 32 * 1024 * 1024;
const MAX_TEXT_BYTES: u64 = 16 * 1024 * 1024;

fn normalized_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_ascii_lowercase())
}

fn image_mime(path: &Path) -> Option<&'static str> {
    match normalized_extension(path).as_deref() {
        Some("png") => Some("image/png"),
        Some("jpg") | Some("jpeg") => Some("image/jpeg"),
        Some("webp") => Some("image/webp"),
        _ => None,
    }
}

fn ensure_file_size(path: &Path, maximum: u64) -> Result<(), String> {
    let metadata =
        fs::metadata(path).map_err(|error| format!("Unable to inspect file: {error}"))?;
    if !metadata.is_file() {
        return Err("The selected path is not a file".into());
    }
    if metadata.len() > maximum {
        return Err(format!(
            "The selected file exceeds the {} MB limit",
            maximum / 1024 / 1024
        ));
    }
    Ok(())
}

#[tauri::command]
fn read_image_as_data_url(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    let mime = image_mime(&path)
        .ok_or_else(|| "Only PNG, JPEG and WebP artwork is supported".to_string())?;
    ensure_file_size(&path, MAX_IMAGE_BYTES)?;
    let bytes = fs::read(&path).map_err(|error| format!("Unable to read artwork: {error}"))?;
    Ok(format!("data:{mime};base64,{}", STANDARD.encode(bytes)))
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    match normalized_extension(&path).as_deref() {
        Some("gforge") | Some("json") => {}
        _ => return Err("Only .gforge and .json project files are supported".into()),
    }
    ensure_file_size(&path, MAX_TEXT_BYTES)?;
    fs::read_to_string(&path).map_err(|error| format!("Unable to read project: {error}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    if contents.len() as u64 > MAX_TEXT_BYTES {
        return Err("Project data exceeds the 16 MB limit".into());
    }
    let path = PathBuf::from(path);
    match normalized_extension(&path).as_deref() {
        Some("gforge") | Some("json") => {}
        _ => return Err("Projects and exports must use .gforge or .json".into()),
    }
    fs::write(&path, contents).map_err(|error| format!("Unable to write file: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_image_as_data_url,
            read_text_file,
            write_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Graphite Forge");
}

#[cfg(test)]
mod tests {
    use super::{image_mime, normalized_extension};
    use std::path::Path;

    #[test]
    fn normalizes_extensions() {
        assert_eq!(
            normalized_extension(Path::new("hero.PNG")).as_deref(),
            Some("png")
        );
    }

    #[test]
    fn accepts_supported_image_types() {
        assert_eq!(image_mime(Path::new("hero.png")), Some("image/png"));
        assert_eq!(image_mime(Path::new("hero.jpeg")), Some("image/jpeg"));
        assert_eq!(image_mime(Path::new("hero.webp")), Some("image/webp"));
        assert_eq!(image_mime(Path::new("hero.gif")), None);
    }
}
