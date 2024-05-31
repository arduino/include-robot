SKETCH_PATH = $(shell pwd)/sketches/BLE_Scratch
scratch-gui-version = v3.2.37

.PHONY: init
init:
	npm install --include=dev
	brew install clang-format
	make scratch-gui-install

.PHONY: scratch-gui-install
scratch-gui-install:
	git clone --depth 1 --branch $(scratch-gui-version)  https://github.com/scratchfoundation/scratch-gui.git
	cd scratch-gui && npm install
	
.PHONY: scratch-gui-patch
scratch-gui-patch:
	cd scratch-gui && node ../scratch-arduino-extensions/scripts/patch-gui.js
	cd scratch-gui && node ../scratch-arduino-extensions/scripts/add-banner.js

.PHONY: scratch-gui-start
scratch-gui-start:
	cd scratch-gui && npm start
.PHONY: scratch-gui-watch
scratch-gui-watch:
	cd scratch-gui && npm watch
.PHONY: scratch-gui-clean
scratch-gui-clean:
	rm -rf scratch-gui

.PHONY: fmt
fmt:
	npx prettier --write "scratch-arduino-extensions/**/*.{js,jsx,ts,tsx,json,css,scss,md}"
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -i

.PHONY: fmt-check
fmt-check:
	npx prettier --check "scratch-arduino-extensions/**/*.{js,jsx,ts,tsx,json,css,scss,md}"
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -n -Werror

.PHONY: compile-all
compile-all: compile-nano33ble compile-nanorp2040connect

.PHONY: compile-nano33ble
compile-nano33ble:
	arduino-cli compile -v -e -b arduino:mbed_nano:nano33ble ${SKETCH_PATH}

.PHONY: compile-nanorp2040connect
compile-nanorp2040connect:
	arduino-cli compile -v -e -b arduino:mbed_nano:nanorp2040connect ${SKETCH_PATH}

.PHONY: upload-nano33ble
upload-nano33ble:
	arduino-cli upload -v \
		-i "${SKETCH_PATH}/build/arduino.mbed_nano.nano33ble/BLE_Scratch.ino.bin" \
		-b arduino:mbed_nano:nano33ble \
		-p "$(shell arduino-cli board list | grep "arduino:mbed_nano:nano33ble" | awk '{print $$1}' | head -n 1)"

.PHONY: upload-nanorp2040connect
upload-nanorp2040connect:
	arduino-cli upload -v \
		-i "${SKETCH_PATH}/build/arduino.mbed_nano.nanorp2040connect/BLE_Scratch.ino.bin" \
		-b arduino:mbed_nano:nanorp2040connect \
		-p "$(shell arduino-cli board list | grep "arduino:mbed_nano:nanorp2040connect" | awk '{print $$1}' | head -n 1)"

.PHONY: monitor
monitor:
	sh -c "arduino-cli monitor -p "$(shell arduino-cli board list | grep -E "arduino:mbed_nano:nano33ble|arduino:mbed_nano:nanorp2040connect" | awk '{print $$1}' | head -n 1)""
