# How to use this app

## Prerequisites:
- rustc 1.89
- node 18

## Installation
Install dependencies with
```sh
npm install
```

## Development
Run development version with command:
```sh
npm run tauri dev
```

Note: at the moment it works **only on a Mac Intel**, due to the presence of only the Mac version of the Arduino CLI in folder `resources/arduino-cli/`

If you want to run it on other platforms, just add the right "sidecar" binary 
as explained here:
https://tauri.app/v1/guides/building/sidecar

Please see the section which starts with 
> A binary with the same name and a -$TARGET_TRIPLE suffix must exist on the specified path. 

## Build

The following command will produce a .dmg file on a Mac
```sh 
npm run tauri build
```

----

# Tauri + React

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
