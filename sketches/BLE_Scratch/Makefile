compile-all: compile-nano33ble compile-nanorp2040connect

compile-nano33ble:
	arduino-cli compile -v -e -b arduino:mbed_nano:nano33ble .

compile-nanorp2040connect:
	arduino-cli compile -v -e -b arduino:mbed_nano:nanorp2040connect .

upload-nano33ble:
	arduino-cli upload -v \
		-i "./build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin" \
		-b arduino:mbed_nano:nano33ble \
		-p "$(shell arduino-cli board list | grep "arduino:mbed_nano:nano33ble" | awk '{print $$1}' | head -n 1)"

upload-nanorp2040connect:
	arduino-cli upload -v \
		-i "./build/arduino.mbed_nano.nanorp2040connect/BLE_Scratch.ino.bin" \
		-b arduino:mbed_nano:nanorp2040connect \
		-p "$(shell arduino-cli board list | grep "arduino:mbed_nano:nanorp2040connect" | awk '{print $$1}' | head -n 1)"

monitor:
	sh -c "arduino-cli monitor -p "$(shell arduino-cli board list | grep -E "arduino:mbed_nano:nano33ble|arduino:mbed_nano:nanorp2040connect" | awk '{print $$1}' | head -n 1)""
