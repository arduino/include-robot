.PHONY: fmt
fmt:
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -i

.PHONY: fmt-check
fmt-check:
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -n -Werror
