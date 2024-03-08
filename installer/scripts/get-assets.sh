#!/bin/sh

# Arduino CLI version
version="0.35.3"

base_dir=$(realpath "$(dirname "$(realpath "$0")")"/../..)
assets_dir="$base_dir/installer/assets"

mkdir -p "$assets_dir"

download_arduino_cli(){
    echo "Downloading Arduino CLI v${version} binaries"

    linux_x64_folder="$assets_dir/linux_x64"
    darwin_x64_folder="$assets_dir/darwin_x64"
    darwin_arm64_folder="$assets_dir/darwin_arm64"
    win_x64_folder="$assets_dir/win_x64"

    # Create directories for each platform
    mkdir -p "$linux_x64_folder"
    mkdir -p "$darwin_x64_folder"
    mkdir -p "$darwin_arm64_folder"
    mkdir -p "$win_x64_folder"

    # Define URLs for the binaries
    linux_x64_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_Linux_64bit.tar.gz"
    darwin_x64_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_macOS_64bit.tar.gz"
    darwin_arm64_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_macOS_arm64.tar.gz"
    win_x64_url="https://github.com/arduino/arduino-cli/releases/download/v${version}/arduino-cli_${version}_Windows_32bit.zip"

    # Download and unpack each binary
    curl -L $linux_x64_url | tar xz -C "$linux_x64_folder"
    curl -L $darwin_x64_url | tar xz -C "$darwin_x64_folder"
    curl -L $darwin_arm64_url | tar xz -C "$darwin_arm64_folder"
    curl -L $win_x64_url -o "$win_x64_folder/arduino-cli.zip" && unzip -o "$win_x64_folder/arduino-cli.zip" -d "$win_x64_folder" && rm "$win_x64_folder/arduino-cli.zip"

    # cleanup
    rm -f "$linux_x64_folder/LICENSE.txt"
    rm -f "$darwin_x64_folder/LICENSE.txt"
    rm -f "$darwin_arm64_folder/LICENSE.txt"
    rm -f "$win_x64_folder/LICENSE.txt"
}

compile_arduino_sketch(){
    echo "Compiling Arduino sketch"

    compile_script=$(realpath "$base_dir/scripts/compile.sh")
    "$compile_script" && cp "$base_dir/sketches/BLE_Scratch/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin" "$base_dir/installer/assets/BLE_Scratch.ino.bin"
}

download_arduino_cli
compile_arduino_sketch
