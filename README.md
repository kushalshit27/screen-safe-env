# Screen-Safe-Env

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/kushals.screen-safe-env?style=flat-square&label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=kushals.screen-safe-env)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/kushals.screen-safe-env?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=kushals.screen-safe-env)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/kushals.screen-safe-env?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=kushals.screen-safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Visually conceal sensitive config values in VS Code during screen sharing, streaming, or recording.**

![Screen Safe Env Demo](https://raw.githubusercontent.com/kushalshit27/screen-safe-env/main/images/demo.gif)

VS Code `settings.json` demo configuration options for Screen-Safe-Env.

```json
{
  "screenSafeEnv.maskMode": "partial",
  "screenSafeEnv.include": ["*.env", "config*.json", "config*.yml"],
  "screenSafeEnv.hoverReveal": true,
  "screenSafeEnv.revealHoldMs": 3000
}
```

Screen-Safe-Env helps developers protect sensitive data (like API keys, passwords, and tokens) in `.env`, JSON, and YAML config files by visually masking them in the editor. The underlying file content remains unchanged—only the display is altered.

## Features

- 🔒 **Visual Concealment**: Automatically hides values in config files (e.g., `API_KEY=*****`).
- 📄 **Multi-Format Support**: Works with `.env`, JSON, and YAML config files.
- 🛡️ **Zero Data Risk**: Does not modify your files and does not store or transmit your secrets.
- ⚙️ **Configurable Masking**: Choose between solid blocks, length-preserving masks, or partial masking.
- 👁️ **Toggle Control**: Quickly toggle concealment on/off via command or status bar.
- 🖱️ **Temporary Reveal**: Peek at secrets by hovering (optional) or using the "Reveal Hold" command.
- 📝 **Customizable**: Configure which files to include and which keys to exclude (e.g., `PORT`, `DEBUG`).

## Supported File Types

| File Type   | Extensions                     | Example              |
| ----------- | ------------------------------ | -------------------- |
| Environment | `.env`, `.env.local`, `.env.*` | `API_KEY=secret`     |
| JSON        | `.json`                        | `"apiKey": "secret"` |
| YAML        | `.yaml`, `.yml`                | `apiKey: secret`     |

## Usage

The extension activates automatically for `.env` files. For JSON and YAML files, add them to the `include` patterns.

### Commands

- `Screen Safe Env: Toggle Hide/Show`: Switch concealment on or off globally.
- `Screen Safe Env: Temporarily Reveal Values`: Reveal values while the command is active (useful for keybindings).
- `Screen Safe Env: Force Rescan Current File`: Manually trigger a scan if the file content changes externally.

### Configuration

You can customize the extension in your VS Code `settings.json`. The extension supports both **User Settings** (global) and **Workspace Settings** (per-project).

#### Example Configuration

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial",
  "screenSafeEnv.include": [
    "**/.env*",
    "*.env",
    "**/config.json",
    "**/secrets.yaml"
  ],
  "screenSafeEnv.excludeKeys": ["PORT", "DEBUG", "NODE_Env"],
  "screenSafeEnv.hoverReveal": false,
  "screenSafeEnv.revealHoldMs": 3000
}
```

#### Settings Reference

| Setting        | Default                 | Description                                                     |
| :------------- | :---------------------- | :-------------------------------------------------------------- |
| `enable`       | `true`                  | Enable/disable the extension.                                   |
| `maskMode`     | `"partial"`             | Mask style: `"solid"`, `"lengthPreserving"`, or `"partial"`.    |
| `include`      | `["**/.env*", "*.env"]` | Glob patterns for files to process (supports .env, JSON, YAML). |
| `excludeKeys`  | `["PORT", "DEBUG"]`     | List of keys to keep visible (case-insensitive).                |
| `hoverReveal`  | `false`                 | Allow revealing values by hovering over them.                   |
| `revealHoldMs` | `3000`                  | Duration (ms) for temporary reveal.                             |

> **Tip:** Use Workspace Settings (`.vscode/settings.json`) for project-specific configurations that differ from your global preferences.

#### Example settings.json

You can use either the **flat** or **nested** form; both are supported by VS Code. For clarity, the flat form works well in `settings.json`.

**Flat form (recommended for settings.json):**

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial",
  "screenSafeEnv.hoverReveal": true,
  "screenSafeEnv.excludeKeys": ["PORT", "DEBUG", "NODE_Env"]
}
```

**Nested form (also supported):**

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial",
    "hoverReveal": true,
    "excludeKeys": ["PORT", "DEBUG", "NODE_Env"]
  }
}
```

## Safety & Privacy

- **Visual Only**: This extension uses VS Code's decoration API to hide text. It does not encrypt your files.
- **No File Modifications**: The extension never writes to, modifies, or edits any files. All masking is purely visual.
- **No Telemetry**: This extension does not collect, store, or transmit any data whatsoever. Your secrets remain entirely on your machine.
- **No Network Requests**: The extension operates completely offline with no external dependencies or API calls.
- **Workspace Trust**: The extension respects VS Code's Workspace Trust and will not operate in untrusted workspaces by default.
- **Open Source**: All code is available for review at [GitHub](https://github.com/kushals/screen-safe-env).

## License

[MIT](LICENSE)
