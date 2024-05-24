#!/usr/bin/env python3

import sys, os

import msgpack

header = bytes([0x8A, 0x48, 0x92, 0xDF, 0xAA, 0x69, 0x5C, 0x41])
magic = bytes([0x7F])

rservo = 3
lservo = 4


def main():
    if len(sys.argv) < 2:
        print("Usage: add-config.py <name>")
        sys.exit(1)

    name = sys.argv[1]
    cfg = msgpack.packb([name, rservo, lservo], use_bin_type=True)

    base = os.path.dirname(os.path.realpath(__file__))
    binary = os.path.join(
        base,
        "../sketches/BLE_Scratch/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin",
    )
    new_name = binary + ".cfg.bin"

    with open(binary, "rb") as f1:
        with open(new_name, "wb") as f2:
            f2.write(f1.read())
            f2.write(header)
            f2.write(magic)
            f2.write(cfg)

    print("Attached", cfg, "to", new_name)


if __name__ == "__main__":
    main()
