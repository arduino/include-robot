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
	make scratch-gui-patch
	
.PHONY: scratch-gui-patch
scratch-gui-patch:
	cd scratch-gui && node ../scratch-arduino-extensions/scripts/patch-gui.js
	cd scratch-gui && node ../scratch-arduino-extensions/scripts/add-banner.js

.PHONY: scratch-gui-start
scratch-gui-start:
	cd scratch-gui && npm start

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
