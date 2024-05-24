use anyhow;
use bytes::Bytes;
use flate2::read::GzDecoder;
use reqwest;
use std::borrow::Cow;
use std::env;
use std::fs;
use std::io;
use std::path;
use std::path::PathBuf;
use std::process::Command;
use zip::read::ZipArchive;

const ARDUINO_CLI_VERSION: &str = "0.35.3";

fn main() {
    let base_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());

    let resource_dir = base_dir.join("../resources");

    download_resources( &resource_dir,&[
        Resource {
            name: "arduino-cli".into(),
            url: format!("https://github.com/arduino/arduino-cli/releases/download/v{0}/arduino-cli_{0}_Linux_64bit.tar.gz", ARDUINO_CLI_VERSION).into(),
            file: "arduino-cli-x86_64-unknown-linux-gnu".into(),
            download: unpack_tar,
        },
        Resource {
            name: "arduino-cli".into(),
            url: format!("https://github.com/arduino/arduino-cli/releases/download/v{0}/arduino-cli_{0}_macOS_64bit.tar.gz", ARDUINO_CLI_VERSION).into(),
            file: "arduino-cli-x86_64-apple-darwin".into(),
            download: unpack_tar,
        },
        Resource {
            name: "arduino-cli".into(),
            url: format!("https://github.com/arduino/arduino-cli/releases/download/v{0}/arduino-cli_{0}_macOS_arm64.tar.gz", ARDUINO_CLI_VERSION).into(),
            file: "arduino-cli-aarch64-apple-darwin".into(),
            download: unpack_tar,
        },
        Resource {
            name: "arduino-cli.exe".into(),
            url: format!("https://github.com/arduino/arduino-cli/releases/download/v{0}/arduino-cli_{0}_Windows_64bit.zip", ARDUINO_CLI_VERSION).into(),
            file: "arduino-cli-x86_64-pc-windows-msvc.exe".into(),
            download: unpack_zip,
        }
    ]).expect("Failed to download resources");

    let arduino_cli = get_arduino_cli_path(&resource_dir);

    let sketches = base_dir.join("../../sketches/BLE_Scratch/BLE_Scratch.ino");

    compile_sketch(&arduino_cli, &sketches, &resource_dir.join("sketch.bin"))
        .expect("Failed to compile sketch");

    println!("cargo:rerun-if-changed={}", sketches.to_str().unwrap());

    tauri_build::build()
}

struct Resource {
    name: Cow<'static, str>,
    url: Cow<'static, str>,
    file: Cow<'static, str>,
    download: fn(Bytes, &path::Path, &Resource) -> anyhow::Result<()>,
}

fn download_resources(base_dir: &path::Path, resources: &[Resource]) -> anyhow::Result<()> {
    let resource_dir = base_dir.join("arduino-cli");

    println!("Download resources to {:?}", resource_dir);

    fs::create_dir_all(&resource_dir)?;

    for resource in resources.iter() {
        let file_path = resource_dir.join(resource.file.as_ref());
        if !file_path.exists() {
            println!("Downloading {}", resource.file.as_ref());
            let bytes = reqwest::blocking::get(resource.url.as_ref())
                .unwrap()
                .bytes()
                .unwrap();

            println!("Unpacking {}", resource.file.as_ref());
            (resource.download)(bytes, &resource_dir, resource)?;
        }
    }

    Ok(())
}

fn get_arduino_cli_path(resource_dir: &path::Path) -> PathBuf {
    let target_triplet = std::env::var("TARGET").unwrap();

    return resource_dir
        .join("arduino-cli")
        .join(format!("arduino-cli-{}", target_triplet));
}

fn compile_sketch(
    arduino_cli: &path::Path,
    sketch: &path::Path,
    to: &path::Path,
) -> anyhow::Result<()> {
    if to.exists() && fs::metadata(to)?.modified()? >= fs::metadata(sketch)?.modified()? {
        println!("Binary up to date");

        return Ok(());
    }

    println!("Compiling sketch '{}'", sketch.to_str().unwrap_or_default());

    let output = Command::new(arduino_cli)
        .args(&[
            "compile",
            "--profile",
            "nano33ble",
            sketch.to_str().unwrap(),
        ])
        .output()?;
    println!(
        "compilation output:\n{}\n{}",
        String::from_utf8_lossy(&output.stderr),
        String::from_utf8_lossy(&output.stdout),
    );

    if !output.status.success() {
        return Err(anyhow::anyhow!("Compilation failed"));
    }

    let dir = sketch.parent().unwrap();
    let file = sketch.file_name().unwrap();
    let bin = dir
        .join("build")
        .join("arduino.mbed_nano.nano33ble")
        .join(file)
        .with_extension("ino.bin");

    println!("Copying {:?} binary to {:?}", bin, to);
    fs::copy(bin, to)?;

    Ok(())
}

fn unpack_tar(bytes: Bytes, resource_dir: &path::Path, resource: &Resource) -> anyhow::Result<()> {
    let reader = io::Cursor::new(bytes);

    let tar = GzDecoder::new(reader);
    let mut archive = tar::Archive::new(tar);

    for file in archive.entries()? {
        let mut file = file?;
        if file.path()?.ends_with(resource.name.as_ref()) {
            file.unpack_in(&resource_dir)?;
            fs::rename(
                resource_dir.join(resource.name.as_ref()),
                resource_dir.join(resource.file.as_ref()),
            )?
        }
    }

    Ok(())
}

fn unpack_zip(bytes: Bytes, resource_dir: &path::Path, resource: &Resource) -> anyhow::Result<()> {
    let reader = io::Cursor::new(bytes);

    let mut archive = ZipArchive::new(reader)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        if file.name() == resource.name.as_ref() {
            let mut outfile = fs::File::create(&resource_dir.join(resource.file.as_ref()))?;
            io::copy(&mut file, &mut outfile)?;
        }
    }

    Ok(())
}
