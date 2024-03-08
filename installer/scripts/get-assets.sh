#!/bin/sh

# Arduino CLI version
version="0.35.3"

base_dir=$(realpath "$(dirname "$(realpath "$0")")"/../..)
assets_dir="$base_dir/installer/assets"

mkdir -p "$assets_dir"

download_arduino_cli(){
    echo "Downloading Arduino CLI v${version} binaries"


    linux_folder="$assets_dir/linux"
    darwin_folder="$assets_dir/darwin"
    win_folder="$assets_dir/win"

    # Create directories for each platform
    mkdir -p "$linux_folder"
    mkdir -p "$darwin_folder"
    mkdir -p "$win_folder"

    # Define URLs for the binaries
    linux_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_Linux_64bit.tar.gz"
    darwin_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_macOS_64bit.tar.gz"
    windows_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_Windows_32bit.zip"

    # Download and unpack each binary
    curl -L $linux_url | tar xz -C "$linux_folder"
    curl -L $darwin_url | tar xz -C "$darwin_folder"
    curl -L $windows_url -o "$win_folder/arduino-cli.zip" && unzip -o "$win_folder/arduino-cli.zip" -d "$win_folder" && rm "$win_folder/arduino-cli.zip"

    # cleanup
    rm -f "$linux_folder/LICENSE.txt"
    rm -f "$darwin_folder/LICENSE.txt"
    rm -f "$win_folder/LICENSE.txt"
}

compile_arduino_sketch(){
    echo "Compiling Arduino sketch"

    compile_script=$(realpath "$base_dir/scripts/compile.sh")
    "$compile_script" && cp "$base_dir/sketches/BLE_Scratch/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin" "$base_dir/installer/assets/BLE_Scratch.ino.bin"
}

download_arduino_cli
compile_arduino_sketch
