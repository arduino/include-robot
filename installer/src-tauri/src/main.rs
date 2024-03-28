// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fmt::Debug;
use std::fs::{File, OpenOptions};
use std::io;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;

use tauri::{Manager, PhysicalSize};

use serde::Serialize;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

const HEADER: &[u8] = b"\x8a\x48\x92\xdf\xaa\x69\x5c\x41";
const MAGIC: &[u8] = b"\x7f";

#[derive(Debug, Serialize)]
struct CmdError(String);

impl From<io::Error> for CmdError {
    fn from(s: io::Error) -> Self {
        CmdError(format!("io error: {}", s))
    }
}

#[tauri::command]
fn append_config(
    app_handle: tauri::AppHandle,
    bin_path: &Path,
    cfg: &str,
) -> Result<PathBuf, CmdError> {
    let path = app_handle.path_resolver();

    let src_path = path
        .resolve_resource(bin_path)
        .ok_or(CmdError("failed to get resolve source path".to_owned()))?;

    let dst_path = path
        .app_cache_dir()
        .ok_or(CmdError("failed to get app cache dir".to_owned()))?
        .join("sketch.cfg.bin");

    let mut src = File::open(src_path)?;
    let mut dst = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&dst_path)?;

    io::copy(&mut src, &mut dst)?;
    dst.write_all(HEADER)?;
    dst.write_all(MAGIC)?;
    dst.write_all(&[cfg.len() as u8])?;
    dst.write_all(cfg.as_bytes())?;

    Ok(dst_path.to_owned())
}

fn main() {

    tauri::Builder::default()
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            main_window.set_min_size(Some(PhysicalSize{width: 500, height: 400})).unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![append_config])
        .run(tauri::generate_context!())
        // .setup(|app| {
        //     let main_window = app.get_window("main").unwrap();
        //     main_window.set_min_size(Some(PhysicalSize::new(300, 300))).unwrap();
      
        //     log::debug!("tauri setup complete");
        //     Ok(())            
        // })
        .expect("error while running tauri application");
}
