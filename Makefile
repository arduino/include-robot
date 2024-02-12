fmt:
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -i

fmt-check:
	find . -name '*.ino' -or -name '*.cpp' -or -name '*.h' | xargs clang-format -n -Werror
