// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fmt::Debug;
use std::fs::{self, File, OpenOptions};
use std::io;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use thiserror::Error;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

const HEADER: &[u8] = b"\x8a\x48\x92\xdf\xaa\x69\x5c\x41";
const MAGIC: &[u8] = b"\x7f";

#[derive(Debug, Error)]
enum CmdError {
    #[error("io error: {0}")]
    Io(#[from] io::Error),
    #[error("msgpack encode error: {0}")]
    Encode(#[from] rmp_serde::encode::Error),
    #[error("fail to resolve '{0}'")]
    Resolve(&'static str),
}

// we must manually implement serde::Serialize
impl serde::Serialize for CmdError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Config order should match the order in the Arduino sketch, because we are using msgpack array.
#[derive(Debug, Serialize, Deserialize)]
struct Config {
    ble_name: String,
    left_servo: u8,
    right_servo: u8,
}

#[tauri::command]
fn append_config(
    app_handle: tauri::AppHandle,
    bin_path: &Path,
    config: Config,
) -> Result<PathBuf, CmdError> {
    let path = app_handle.path_resolver();

    let config_buf = rmp_serde::to_vec(&config)?;

    let src_path = path
        .resolve_resource(bin_path)
        .ok_or(CmdError::Resolve("source path"))?;

    let cache_dir = path
        .app_cache_dir()
        .ok_or(CmdError::Resolve("cache dir path"))?;

    fs::create_dir_all(&cache_dir)?;

    let dst_path = cache_dir.join("sketch.cfg.bin");

    let mut src = File::open(src_path)?;
    let mut dst = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(&dst_path)?;

    io::copy(&mut src, &mut dst)?;
    dst.write_all(HEADER)?;
    dst.write_all(MAGIC)?;
    dst.write_all(&config_buf)?;
    
    Ok(dst_path.to_owned())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![append_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
