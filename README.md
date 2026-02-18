# nimShot

Fast, beautiful screenshot tool for Windows built with Tauri + React.

## Features

- **Instant Capture**: Press `Ctrl+Alt+S` to capture screenshots
- **Beautiful Gallery**: Organize and browse your screenshots
- **Floating Widget**: Quick access widget always on screen
- **Auto-Update**: Automatic updates with no manual intervention
- **Privacy First**: All data stored locally on your device

## Development

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Windows 10/11

### Setup

```bash
# Install dependencies
npm install

# Run development build
npm run tauri dev

# Build for production
npm run tauri build
```

## Releasing

1. Update version in `package.json` and `src-tauri/Cargo.toml`
2. Update version in `src-tauri/tauri.conf.json`
3. Create a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically build and create a release

## Auto-Update Setup

The app uses Tauri's built-in updater plugin. To enable:

1. Generate signing keys:
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/nimshot.key
   ```

2. Add the public key to `src-tauri/tauri.conf.json`:
   ```json
   {
     "plugins": {
       "updater": {
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. Add secrets to GitHub:
   - `TAURI_SIGNING_PRIVATE_KEY`: The private key content
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: The password for the key

## License

MIT
