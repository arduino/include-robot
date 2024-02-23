.PHONY: init
init:
	npm install --include=dev
	brew install clang-format

.PHONY: fmt
fmt:
	npx prettier --write "scratch-arduino-extensions/**/*.{js,jsx,ts,tsx,json,css,scss,md}"
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -i

.PHONY: fmt-check
fmt-check:
	npx prettier --check "scratch-arduino-extensions/**/*.{js,jsx,ts,tsx,json,css,scss,md}"
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -n -Werror
