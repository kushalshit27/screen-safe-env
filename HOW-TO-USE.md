# How to Use Screen-Safe-Env

A comprehensive guide to installing, configuring, and using the Screen-Safe-Env extension.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Commands & Keybindings](#commands--keybindings)
- [Testing the Extension](#testing-the-extension)
- [Development Setup](#development-setup)
- [Troubleshooting](#troubleshooting)

---

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux) to open Extensions
3. Search for "Screen Safe Env"
4. Click **Install**

### From VSIX File

1. Download the `.vsix` file from [GitHub Releases](https://github.com/kushalshit27/screen-safe-env/releases)
2. Open VS Code
3. Press `Cmd+Shift+P` / `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
4. Select the downloaded `.vsix` file

---

## Quick Start

1. **Open a `.env` file** — The extension activates automatically
2. **Values are masked** — You'll see `*****` instead of actual values
3. **Check the status bar** — Look for "🙈 Env Masked" in the bottom right
4. **Toggle masking** — Click the status bar item or use `Cmd+Shift+E`

---

## Configuration

### Accessing Settings

**Option 1: VS Code Settings UI**
1. Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Search for "Screen Safe Env"
3. Modify settings as needed

**Option 2: settings.json**
1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type "Preferences: Open Settings (JSON)"
3. Add your configuration

### Global vs Workspace Settings

The extension supports two levels of configuration:

| Level | Location | Use Case |
|-------|----------|----------|
| **User Settings** | `~/Library/Application Support/Code/User/settings.json` (Mac) | Global defaults for all projects |
| **Workspace Settings** | `.vscode/settings.json` in your project | Project-specific overrides |

> **Priority:** Workspace settings override User settings when both are defined.

### Configuration Examples

You can use either **nested** or **flat** settings; both are supported. Flat keys are often convenient in `settings.json`, while nested keeps related keys grouped. Here’s a quick mapping:

**Flat:**

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial",
  "screenSafeEnv.hoverReveal": true
}
```

**Nested:**

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial",
    "hoverReveal": true
  }
}
```

#### Example 1: Basic Setup (Default)

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial"
  }
}
```

**Result:**

```text
API_KEY=sk***ey
DATABASE_URL=po***ql
SECRET_TOKEN=gh***en
```

#### Example 2: Length-Preserving Masks

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "lengthPreserving"
  }
}
```

**Result:**

```text
API_KEY=****************    (matches original length)
DATABASE_URL=**************************
SECRET_TOKEN=************
```

#### Example 3: Partial Reveal (First/Last Characters)

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial"
  }
}
```

**Result:**

```text
API_KEY=sk***ey            (shows first 2 and last 2 chars)
DATABASE_URL=po***ql
SECRET_TOKEN=gh***en
```

#### Example 4: Custom File Patterns

```json
{
  "screenSafeEnv": {
    "enable": true,
    "include": [
      "**/.env*",
      "*.env",
      "**/secrets/**/*.env",
      "**/.secrets"
    ]
  }
}
```

#### Example 5: Exclude Specific Keys

```json
{
  "screenSafeEnv": {
    "enable": true,
    "excludeKeys": [
      "PORT",
      "DEBUG",
      "NODE_Env",
      "LOG_LEVEL",
      "HOST",
      "HOSTNAME"
    ]
  }
}
```

**Result:**

```text
PORT=3000                   (visible - excluded)
DEBUG=true                  (visible - excluded)
NODE_Env=development        (visible - excluded)
API_KEY=*****              (masked)
DATABASE_URL=*****         (masked)
```

#### Example 6: Enable Hover Reveal

```json
{
  "screenSafeEnv": {
    "enable": true,
    "hoverReveal": true
  }
}
```

Flat equivalent:

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.hoverReveal": true
}
```

When you hover over a masked value, a tooltip shows the actual value with a privacy warning.

#### Example 7: Custom Reveal Duration

```json
{
  "screenSafeEnv": {
    "enable": true,
    "revealHoldMs": 5000
  }
}
```

The "Temporarily Reveal Values" command will show values for 5 seconds instead of the default 3 seconds.

#### Example 8: Full Configuration (User Settings)

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial",
    "include": [
      "**/.env*",
      "*.env",
      "**/config/secrets.*"
    ],
    "excludeKeys": [
      "PORT",
      "DEBUG",
      "NODE_Env",
      "LOG_LEVEL"
    ],
    "hoverReveal": false,
    "revealHoldMs": 3000
  }
}
```

#### Example 9: Workspace Settings (`.vscode/settings.json`)

Create a `.vscode/settings.json` file in your project root to override global settings:

```json
{
  "screenSafeEnv": {
    "excludeKeys": [
      "PORT",
      "DEBUG",
      "NODE_Env",
      "APP_NAME",
      "APP_VERSION"
    ],
    "maskMode": "lengthPreserving"
  }
}
```

This allows different projects to have different masking configurations.

### Configuration Reference

All settings are under the `screenSafeEnv` namespace:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable` | boolean | `true` | Master switch to enable/disable masking |
| `maskMode` | enum | `"partial"` | `"solid"`, `"lengthPreserving"`, or `"partial"` |
| `include` | array | `["**/.env*", "*.env"]` | Glob patterns for files to process |
| `excludeKeys` | array | `["PORT", "DEBUG"]` | Keys whose values remain visible |
| `hoverReveal` | boolean | `false` | Show actual value on hover |
| `revealHoldMs` | number | `3000` | Duration (ms) for temporary reveal (500-30000) |

> **Note:** You can use either flat (`"screenSafeEnv.enable": true`) or nested (`"screenSafeEnv": { "enable": true }`) formats; both are supported. Choose whichever you prefer for your settings file.

#### Both Configuration Formats Supported

The extension supports both nested and flat configuration formats:

**Nested:**

```json
{
  "screenSafeEnv": {
    "enable": true,
    "maskMode": "partial"
  }
}
```

**Flat:**

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial"
}
```

---

## Commands & Keybindings

### Available Commands

| Command | Description | Default Keybinding |
|---------|-------------|-------------------|
| `Screen Safe Env: Toggle Hide/Show` | Toggle masking on/off | `Cmd+Shift+E` (Mac) / `Ctrl+Shift+E` |
| `Screen Safe Env: Temporarily Reveal Values` | Reveal values temporarily | `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` |
| `Screen Safe Env: Force Rescan Current File` | Manually refresh decorations | — |

### Using Commands

**Via Command Palette:**

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Screen Safe Env"
3. Select the desired command

**Via Keybindings:**

- Toggle masking: `Cmd+Shift+E` / `Ctrl+Shift+E`
- Temporary reveal: `Cmd+Shift+R` / `Ctrl+Shift+R`

**Via Status Bar:**

- Click the status bar item (bottom right) to toggle masking

### Custom Keybindings

Add to your `keybindings.json`:

```json
[
  {
    "key": "ctrl+alt+m",
    "command": "screen-safe-env.toggleHideShow",
    "when": "editorLangId == dotenv || editorLangId == json || editorLangId == yaml"
  },
  {
    "key": "ctrl+alt+r",
    "command": "screen-safe-env.temporarilyReveal",
    "when": "editorLangId == dotenv || editorLangId == json || editorLangId == yaml"
  }
]
```

---

## Testing the Extension

### Step 1: Create a Test .env File

Create a file named `.env` in any project:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password123@localhost:5432/mydb
DB_PASSWORD=super_secret_password

# API Keys
API_KEY=sk-1234567890abcdef
STRIPE_SECRET_KEY=sk_live_abc123xyz789
OPENAI_API_KEY=sk-proj-abcdefghijklmnop

# App Configuration
PORT=3000
DEBUG=true
NODE_Env=development

# OAuth Secrets
GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
```

### Step 2: Verify Masking

1. Open the `.env` file in VS Code
2. Values should be masked automatically:

  ```text
  DATABASE_URL=*****
  DB_PASSWORD=*****
  API_KEY=*****
  PORT=3000          ← Visible (excluded by default)
  DEBUG=true         ← Visible (excluded by default)
  ```

### Step 3: Test Toggle Command

1. Press `Cmd+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows/Linux)
2. Values should become visible
3. Press again to re-mask

### Step 4: Test Temporary Reveal

1. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. Values reveal for 3 seconds (configurable)
3. Values automatically re-mask

### Step 5: Test Status Bar

1. Look at the bottom right of VS Code
2. Click "🙈 Env Masked" to toggle
3. Status changes to "👁 Env Visible"

### Step 6: Test Mask Modes

1. Open Settings (`Cmd+,`)
2. Search "screenSafeEnv.maskMode"
3. Try each mode:
   - `solid`: `API_KEY=*****`
   - `lengthPreserving`: `API_KEY=********************`
   - `partial`: `API_KEY=sk***ef`

### Step 7: Test JSON Config Files

1. Add `**/config.json` to your `include` patterns
2. Create a `config.json` file:

```json
{
  "database": {
    "host": "localhost",
    "password": "secret123"
  },
  "apiKey": "sk-1234567890"
}
```

3. String values should be masked: `"password": "*****"`

### Step 8: Test YAML Config Files

1. Add `**/secrets.yaml` to your `include` patterns
2. Create a `secrets.yaml` file:

```yaml
database:
  host: localhost
  password: secret123
apiKey: sk-1234567890
port: 3000  # Will be visible if excluded
```

3. Values should be masked: `password: *****`

### Step 9: Test Hover Reveal (Optional)

1. Enable: `"screenSafeEnv.hoverReveal": true`
2. Hover over a masked value
3. A tooltip shows the actual value with a warning

---

## Development Setup

### Prerequisites

- Node.js 18+
- VS Code 1.85+
- Git

### Clone and Install

```bash
git clone https://github.com/kushalshit27/screen-safe-env.git
cd screen-safe-env
npm install
```

### Build

```bash
npm run compile
```

### Run Extension in Development Mode

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Open a `.env` file in the new VS Code window
4. Test your changes

### Run Tests

```bash
npm test  # Runs all 118 tests
```

### Package Extension

```bash
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file you can install locally.

---

## Troubleshooting

### Values Not Being Masked

1. **Check if enabled**: Ensure `screenSafeEnv.enable` is `true`
2. **Check file pattern**: Verify your file matches `screenSafeEnv.include` patterns
3. **Check language mode**: File should be detected as "Environment Variables" (dotenv)
4. **Force rescan**: Run "Screen Safe Env: Force Rescan Current File"

### Extension Not Activating

1. **Check Workspace Trust**: Extension is disabled in untrusted workspaces
2. **Reload VS Code**: Press `Cmd+Shift+P` → "Developer: Reload Window"
3. **Check Output panel**: View → Output → Select "Screen Safe Env" from dropdown

### Keybindings Not Working

1. **Check conflicts**: Press `Cmd+K Cmd+S` to open Keyboard Shortcuts
2. **Search for conflicts**: Look for `Cmd+Shift+E` or `Ctrl+Shift+E`
3. **Verify context**: Keybindings work in `.env`, `.json`, and `.yaml` files

### Status Bar Not Visible

1. **Check status bar visibility**: View → Appearance → Show Status Bar
2. **Check position**: Look at the right side of the status bar
3. **Open a config file**: Status bar appears when viewing `.env`, `.json`, or `.yaml` files that match include patterns

### Performance Issues

1. **Large files**: The extension debounces updates (150ms) for performance
2. **Many patterns**: Reduce the number of glob patterns in `include`
3. **Disable when not needed**: Toggle off via status bar during intensive work

---

## Support

- **Issues**: [GitHub Issues](https://github.com/kushalshit27/screen-safe-env/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kushalshit27/screen-safe-env/discussions)
- **Source Code**: [GitHub Repository](https://github.com/kushalshit27/screen-safe-env)

---

## License

[MIT](LICENSE) © kushalshit27
