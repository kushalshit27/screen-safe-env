# How to Use Screen-Safe-ENV

A comprehensive guide to installing, configuring, and using the Screen-Safe-ENV extension.

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
3. Search for "Screen Safe ENV"
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
3. **Check the status bar** — Look for "🙈 ENV Masked" in the bottom right
4. **Toggle masking** — Click the status bar item or use `Cmd+Shift+E`

---

## Configuration

### Accessing Settings

**Option 1: VS Code Settings UI**
1. Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Search for "Screen Safe ENV"
3. Modify settings as needed

**Option 2: settings.json**
1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type "Preferences: Open Settings (JSON)"
3. Add your configuration

### Configuration Examples

#### Example 1: Basic Setup (Default)

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "solid"
}
```

**Result:**
```
API_KEY=*****
DATABASE_URL=*****
SECRET_TOKEN=*****
```

#### Example 2: Length-Preserving Masks

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "lengthPreserving"
}
```

**Result:**
```
API_KEY=****************    (matches original length)
DATABASE_URL=**************************
SECRET_TOKEN=************
```

#### Example 3: Partial Reveal (First/Last Characters)

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial"
}
```

**Result:**
```
API_KEY=sk***ey            (shows first 2 and last 2 chars)
DATABASE_URL=po***ql
SECRET_TOKEN=gh***en
```

#### Example 4: Custom File Patterns

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.include": [
    "**/.env*",
    "*.env",
    "**/secrets/**/*.env",
    "**/.secrets"
  ]
}
```

#### Example 5: Exclude Specific Keys

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.excludeKeys": [
    "PORT",
    "DEBUG",
    "NODE_ENV",
    "LOG_LEVEL",
    "HOST",
    "HOSTNAME"
  ]
}
```

**Result:**
```
PORT=3000                   (visible - excluded)
DEBUG=true                  (visible - excluded)
NODE_ENV=development        (visible - excluded)
API_KEY=*****              (masked)
DATABASE_URL=*****         (masked)
```

#### Example 6: Enable Hover Reveal

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
  "screenSafeEnv.enable": true,
  "screenSafeEnv.revealHoldMs": 5000
}
```

The "Temporarily Reveal Values" command will show values for 5 seconds instead of the default 3 seconds.

#### Example 8: Full Configuration

```json
{
  "screenSafeEnv.enable": true,
  "screenSafeEnv.maskMode": "partial",
  "screenSafeEnv.include": [
    "**/.env*",
    "*.env",
    "**/config/secrets.*"
  ],
  "screenSafeEnv.excludeKeys": [
    "PORT",
    "DEBUG",
    "NODE_ENV",
    "LOG_LEVEL"
  ],
  "screenSafeEnv.hoverReveal": false,
  "screenSafeEnv.revealHoldMs": 3000
}
```

### Configuration Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `screenSafeEnv.enable` | boolean | `true` | Master switch to enable/disable masking |
| `screenSafeEnv.maskMode` | enum | `"solid"` | `"solid"`, `"lengthPreserving"`, or `"partial"` |
| `screenSafeEnv.include` | array | `["**/.env*", "*.env"]` | Glob patterns for files to process |
| `screenSafeEnv.excludeKeys` | array | `["PORT", "DEBUG"]` | Keys whose values remain visible |
| `screenSafeEnv.hoverReveal` | boolean | `false` | Show actual value on hover |
| `screenSafeEnv.revealHoldMs` | number | `3000` | Duration (ms) for temporary reveal (500-30000) |

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
    "when": "editorLangId == dotenv"
  },
  {
    "key": "ctrl+alt+r",
    "command": "screen-safe-env.temporarilyReveal",
    "when": "editorLangId == dotenv"
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
NODE_ENV=development

# OAuth Secrets
GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
```

### Step 2: Verify Masking

1. Open the `.env` file in VS Code
2. Values should be masked automatically:
   ```
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
2. Click "🙈 ENV Masked" to toggle
3. Status changes to "👁 ENV Visible"

### Step 6: Test Mask Modes

1. Open Settings (`Cmd+,`)
2. Search "screenSafeEnv.maskMode"
3. Try each mode:
   - `solid`: `API_KEY=*****`
   - `lengthPreserving`: `API_KEY=********************`
   - `partial`: `API_KEY=sk***ef`

### Step 7: Test Hover Reveal (Optional)

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
npm test
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
3. **Check Output panel**: View → Output → Select "Screen Safe ENV" from dropdown

### Keybindings Not Working

1. **Check conflicts**: Press `Cmd+K Cmd+S` to open Keyboard Shortcuts
2. **Search for conflicts**: Look for `Cmd+Shift+E` or `Ctrl+Shift+E`
3. **Verify context**: Keybindings only work in `.env` files (`editorLangId == dotenv`)

### Status Bar Not Visible

1. **Check status bar visibility**: View → Appearance → Show Status Bar
2. **Check position**: Look at the right side of the status bar
3. **Open a .env file**: Status bar only appears when viewing `.env` files

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
