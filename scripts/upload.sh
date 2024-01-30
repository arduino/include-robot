#!/bin/sh

set -xe

base=$(dirname "$0")
binary="$base/../sketches/BLE_Scratch/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.with_bootloader.bin.cfg.bin"

port=$(arduino-cli board list | grep "arduino:mbed_nano:nano33ble" | awk '{print $1}' | head -n 1)

arduino-cli upload -v \
    -i "$binary" \
    -b arduino:mbed_nano:nano33ble \
    -p "$port"
