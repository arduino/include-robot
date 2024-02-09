#!/usr/bin/env python3

import sys, os

header = bytes([0x8a, 0x48, 0x92, 0xdf, 0xaa, 0x69, 0x5c, 0x41])
magic = bytes([0x7F])


def main():
    if len(sys.argv) < 2:
        print("Usage: add-config.py <config>")
        sys.exit(1)

    cfg = sys.argv[1]

    base = os.path.dirname(os.path.realpath(__file__))
    binary = os.path.join(base, "../sketches/BLE_Scratch/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin")
    new_name = binary+".cfg.bin"
    
    with open(binary, 'rb') as f1:
        with open(new_name, 'wb') as f2:
            f2.write(f1.read())
            f2.write(header)
            f2.write(magic)
            f2.write(len(cfg).to_bytes(1, byteorder='little'))
            f2.write(cfg.encode("ascii"))

    print("Attached", cfg, "to", new_name)

if __name__ == '__main__':
    main()
