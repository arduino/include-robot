#!/bin/sh

set -xe

base=$(dirname "$0")

arduino-cli compile -b arduino:mbed_nano:nano33ble -e "$base/../sketches/BLE_Scratch/BLE_Scratch.ino"
